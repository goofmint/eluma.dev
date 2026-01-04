# 仕様書（ドラフト）AI時代向けソーシャルブックマーク

## 1. 目的とスコープ

### 1.1 目的

- 個人がブックマーク（URL）とコメント（自由記述）を蓄積できるソーシャルブックマークを提供します。
- 個人のブックマークを束ねて「チャンネル（YouTube風）」として公開・フォロー可能にします。
- AIは以下に限定して利用します：
  - レコメンド（おすすめ）
  - 保存済みページに関する質問応答（MCP経由）
  - コメントのスパム/攻撃性チェック（モデレーション）
  - 公開向け要約/抽出（任意：表示レイヤー用）

### 1.2 スコープ外

- 長文記事のホスティング（外部URLが主）
- 広告配信・決済・課金
- リアルタイムチャット

---

## 2. 用語

- **Bookmark**：URLを中心とした保存エントリ
- **Comment**：Bookmarkに紐づくユーザー投稿（自由記述）
- **Channel**：Bookmarkを束ねる公開単位（テーマ/発信単位）
- **Follow**：ユーザーがユーザー/チャンネルを購読する関係
- **Save**：他者のBookmark/Channel投稿を自分のBookmarkとして保存（メモ可）
- **Visibility**：公開範囲（friends/followers/public 等）
- **Org**：組織（複数所属可）
- **MCP**：外部クライアント（例：LLMクライアント）から問い合わせるためのプロトコル/サーバー

---

## 3. 前提技術スタック

### 3.1 プロダクション

- Runtime：Cloudflare Workers
- API：Hono（Workers上）
- UI：React Router（SPA）
- BaaS/DB：Supabase（PostgreSQL、Auth、Storage）
- Queue/Storage（任意拡張）：Cloudflare Queues / R2（将来）

### 3.2 OSS版（セルフホスト）

- docker compose で以下を起動可能にします：
  - API（Node互換ランタイム上でHono or Worker互換）
  - UI（静的配信）
  - DB（PostgreSQL）
  - 認証（Supabase互換を採用する場合は supabase CLI / self-host、または独自Auth）

- 仕様上は「Supabase前提」を保ち、OSS版は **Supabase self-host** を推奨構成とします。

---

## 4. 全体アーキテクチャ

### 4.1 構成要素

- **UI（React Router）**
  - ブックマーク閲覧/作成/保存
  - コメント投稿/閲覧（可視化制御を反映）
  - チャンネル作成/運用/閲覧
  - フォロー管理
  - 個人/組織コンテキスト切替

- **API（Hono on Workers）**
  - CRUD（Bookmark/Comment/Channel/Follow/Save）
  - フィード生成（ユーザー/チャンネル）
  - 検索（全文/メタ/ベクトルは将来拡張）
  - AIモデレーション実行・結果反映
  - MCPエンドポイント（search/ask 等）

- **Supabase**
  - Auth（個人/組織メンバーシップ）
  - DB（PostgreSQL）
  - Storage（ページスナップショット、OGP等任意）

---

## 5. 機能要件

## 5.1 個人ブックマーク

### 5.1.1 Bookmark作成

- 入力：URL（必須）、タイトル（任意/自動）、コメント（任意）、タグ（任意）、visibility（任意）
- 保存時にメタ取得（任意）：
  - title/description/OGP
  - 取得に失敗しても保存自体は成功

### 5.1.2 Bookmark一覧/詳細

- 自分のBookmarkを時系列で閲覧可能
- URL、タイトル、作成者コメント、タグ、作成日時、保存数などを表示（表示項目はUI側で調整）

### 5.1.3 Save（他者コンテンツを自分に保存）

- 他者のBookmarkまたはChannel投稿を、自分のBookmarkとして保存できます。
- Save時に「自分用メモ」を追加できます（デフォルト非公開）。

---

## 5.2 コメント（自由記述）

### 5.2.1 コメント投稿

- コメント内容はユーザーの自由入力とします（型制限なし）。
- 投稿と同時にAIモデレーションを実行し、結果に応じて表示制御します。

### 5.2.2 コメント表示制御（荒れ対策の基本方針）

- **入力は自由**、**出力（可視化）を制御**します。
- 原則として以下を実装します：
  - コメント返信（スレッド）なし
  - メンション機能なし
  - コメントに対する「いいね/低評価」なし（炎上導線排除）

- 表示条件：
  - `visibility` を満たすこと
  - かつ `mod_status == allowed` であること

### 5.2.3 企業チャンネルはコメントOFF可能

- チャンネル単位でコメント許可を切り替え可能にします。
- 企業（Org）チャンネルのデフォルトは **コメントOFF** を推奨設定とします（仕様上は設定可能であればよい）。

---

## 5.3 チャンネル（YouTube風）

### 5.3.1 チャンネル作成

- チャンネルはユーザーが作成可能です。
- チャンネル所有者：User または Org
- 属性：
  - name, handle（ユニーク）
  - description
  - icon/banner（任意）
  - comment_policy（on/off、将来拡張で承認制など）

### 5.3.2 チャンネル投稿

- 投稿は「Bookmarkの束ね」として扱います。
- チャンネル投稿は以下の形を許可します：
  - 既存Bookmarkをチャンネルに追加（playlist相当）
  - チャンネル用の短い紹介文（任意）

- チャンネル投稿の閲覧者は：
  - いいね
  - Save（自分のBookmark化、メモ可）
    を実行できます。

### 5.3.3 フォロー

- ユーザーは以下をフォロー可能：
  - User
  - Channel

- フォローによりフィードに反映されます。

---

## 5.4 公開範囲（Visibility）

### 5.4.1 種別

- `friends`：相互承認（デフォルト対象）
- `followers`：フォロワーまで
- `public`：全体公開
- `org`：組織内限定（Org所有時のみ）

### 5.4.2 デフォルト

- 個人Bookmark/Commentのデフォルトは `friends` とします。
- チャンネル投稿のデフォルトは `public`（個人チャンネル）／ `public`または`org`（Orgチャンネルでポリシー設定可）

---

## 5.5 AI機能

## 5.5.1 モデレーション（コメントスパム/攻撃性）

- コメント作成/更新時にモデレーションを実行します。
- 返却結果を保存し、表示判定に利用します。

**データとして保持する項目例**

- model
- flagged（bool）
- category_scores（json）
- decision（allowed/hidden/needs_review）
- evaluated_at

※ 実際の閾値・判定ルールは環境変数で調整可能にします。

## 5.5.2 レコメンド（おすすめ）

- ユーザーの以下を入力として推薦します：
  - 自分のBookmark/Save履歴
  - フォロー関係（User/Channel）
  - 閲覧/再訪（任意で計測）

- 初期MVPはルールベースでも可（将来MLへ差し替え）。

## 5.5.3 MCP（質問応答）

- ブックマークしたページ（およびメモ/コメント）について質問可能にします。
- MCPサーバーとして以下のツール（API）を提供します。

---

## 6. MCP仕様（APIレベル）

### 6.1 提供ツール（最低限）

- `search_bookmarks(query, filters)`
  - filters：owner（user/org）、channel_id、date_range、visibility 等

- `get_bookmark(id)`
- `ask_bookmarks(question, filters)`
  - 回答には根拠（参照bookmark/comment）を返す設計にします（UI/クライアント側が表示可能）。

- `get_comments(bookmark_id, mode)`
  - mode：allowed_only / all_for_owner 等（権限により制御）

### 6.2 参照範囲

- デフォルトは「本人がアクセス可能な範囲」に限定します。
- 公開データ（public）は、クライアント権限に応じて参照可能にします。

---

## 7. 認証・権限

### 7.1 Auth

- Supabase Authでユーザー認証
- APIはJWT検証

### 7.2 Principal（主体）

- User（個人）
- Org（組織）
- Userは複数Orgに所属可能

### 7.3 権限（例）

- Bookmark/Comment
  - personal：owner_userのみ編集可
  - org：org_member（roleに応じて）編集可

- Channel
  - owner（User/Org）＋adminが編集可

- Comment policy（on/off）
  - channel ownerのみ変更可

---

## 8. データモデル（テーブル案）

### 8.1 コア

- `users`
- `orgs`
- `org_members`（user_id, org_id, role）
- `bookmarks`（owner_user_id | owner_org_id, url, title, note, visibility, created_at）
- `comments`（bookmark_id, author_user_id, body, visibility, mod_status, created_at）
- `channels`（owner_user_id | owner_org_id, handle, name, description, comment_policy）
- `channel_items`（channel_id, bookmark_id, pinned, added_at）
- `follows`（follower_user_id, target_type(user/channel), target_id, created_at）
- `saves`（user_id, source_type(bookmark/channel_item), source_id, memo, created_at）

### 8.2 モデレーション

- `comment_moderation`（comment_id, model, flagged, category_scores, decision, evaluated_at）

### 8.3 関係（friends）

- `friend_requests`（from_user_id, to_user_id, status）
- `friends`（user_id_a, user_id_b, created_at）

---

## 9. API（Hono）エンドポイント案

### 9.1 Bookmark

- `POST /api/bookmarks`
- `GET /api/bookmarks`（filters）
- `GET /api/bookmarks/:id`
- `PATCH /api/bookmarks/:id`
- `DELETE /api/bookmarks/:id`

### 9.2 Comment

- `POST /api/bookmarks/:id/comments`（モデレーション実行）
- `GET /api/bookmarks/:id/comments`（allowedのみ/ownerはall可）
- `PATCH /api/comments/:id`（再モデレーション）
- `DELETE /api/comments/:id`

### 9.3 Channel

- `POST /api/channels`
- `GET /api/channels/:handle`
- `PATCH /api/channels/:id`（comment_policy含む）
- `POST /api/channels/:id/items`（bookmark追加）
- `DELETE /api/channels/:id/items/:item_id`

### 9.4 Follow / Save / Like

- `POST /api/follows`
- `DELETE /api/follows/:id`
- `POST /api/saves`
- `DELETE /api/saves/:id`
- `POST /api/likes`（target_type, target_id）
- `DELETE /api/likes/:id`

### 9.5 Feed / Recommend

- `GET /api/feed`（followed user/channel + public）
- `GET /api/recommendations`

### 9.6 MCP

- `POST /api/mcp/search_bookmarks`
- `POST /api/mcp/ask_bookmarks`
- `GET /api/mcp/bookmarks/:id`

---

## 10. UI要件（React Router）

### 10.1 主要画面

- ホーム（フィード/おすすめ）
- ブックマーク作成
- ブックマーク詳細（コメント、Save、いいね）
- チャンネルページ（投稿一覧、フォロー、コメントポリシー表示）
- プロフィール（ユーザー）
- 友達/フォロー管理
- 個人/組織コンテキスト切替（複数Org）

### 10.2 コメント表示

- デフォルト：allowedのみ
- スレッドなし（フラット表示）
- コメント投稿は常に可能（チャンネルが許可している場合）

---

## 11. デプロイ要件

### 11.1 プロダクション（Cloudflare Workers）

- API：Workers（Hono）
- UI：Cloudflare Pages または Workers static
- 環境変数：
  - Supabase URL / Key
  - Moderation API Key
  - MCP設定（必要に応じて）

### 11.2 OSS（docker compose）

- `docker-compose.yml` に以下を含めます：
  - postgres
  - supabase（推奨：self-host構成一式）
  - api
  - ui

- `.env` で本番同等の設定項目を提供します。

---

## 12. 非機能要件（最低限）

- **可用性**：Workers前提でステートレス
- **セキュリティ**：
  - JWT検証
  - Row Level Security（Supabase）活用
  - 公開範囲（visibility）に基づくアクセス制御

- **モデレーション**：
  - コメント作成/更新時に必ず評価
  - `hidden` は既定で非表示

- **監査/ログ**（任意）：
  - 重要操作（削除/公開範囲変更/チャンネル設定変更）を記録

---

## 13. 既定ポリシー（MVP）

- 個人Bookmark/Comment：`friends` デフォルト
- コメント：自由記述、AIでフラグ、スレッドなし
- 企業（Org）チャンネル：コメントOFF可能（デフォルトOFF推奨）
- 閲覧者アクション：いいね、保存（自分のブックマーク化＋メモ）
