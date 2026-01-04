# タスクリスト（PR＝イテレーション単位）

前提：
- 各イテレーションは「ローカル（docker-compose）で動作確認可能」かつ「Cloudflare Workersへデプロイ可能」な状態にする
- 各イテレーションは最終的に1PRとしてレビュー可能な粒度に分割する
- 仕様書に基づき、MVP → 機能追加の順で段階的に積み上げる

---

## Iteration 0（PR#0）リポジトリ雛形・開発基盤（ローカルのみ）
目的：開発が開始できる最小基盤。ローカルでUI/API/DBが起動し、疎通が取れる。

- [ ] monorepo 構成作成（例：`apps/api`, `apps/web`, `infra/`）
- [ ] Node/Yarn/pnpm 等のパッケージ管理方針決定・導入
- [ ] `docker-compose.yml` 作成（Postgres + Supabase self-host 推奨 + api + web）
- [ ] Supabase self-host 構成のセットアップ（最低限：Auth/DB）
- [ ] Hono API サーバー雛形（ローカル起動、`/healthz`）
- [ ] React Router UI 雛形（ローカル起動、トップページ表示）
- [ ] UI → API 疎通（`/healthz` を叩いて表示）
- [ ] 環境変数の雛形（`.env.example`）とREADME手順（起動・停止・初期化）
- [ ] Lint/Format（ESLint/Prettier）導入、CI（lint/test）追加（GitHub Actions）

成果物（確認方法）：
- `docker compose up` で起動し、UIが表示され、API疎通が確認できる

---

## Iteration 1（PR#1）Cloudflare Workers デプロイ基盤（最小）
目的：同じAPI/UIがCloudflareへデプロイできる。以降は「毎PRデプロイ可能」を担保。

- [ ] Workers 用プロジェクト設定（wrangler）追加（API）
- [ ] UIのデプロイ先決定（推奨：Cloudflare Pages or Workers static）と雛形設定
- [ ] GitHub Actions：`main` マージで自動デプロイ（API/UI）
- [ ] 環境変数/Secrets（Supabase URL/Key）設定方法をREADMEへ追記
- [ ] `GET /healthz` をWorkers上でも動作させる
- [ ] UIからWorkersの`/healthz`疎通確認（環境別ベースURL切替）
- [ ] Preview環境（PRごとデプロイ）を可能なら設定（少なくとも手動でPR確認できる導線）

成果物（確認方法）：
- Workers上の`/healthz`が応答し、UIから到達できる

---

## Iteration 2（PR#2）認証（Supabase Auth）＋最小RLS（MVP準備）
目的：ログイン前提で個人データを扱える基盤。RLSで他人データが見えない状態を確立。

- [ ] Supabase Auth（Email/Password or Magic Link）方式を決定しUI実装
- [ ] APIでJWT検証（Bearer）を追加（未認証は401）
- [ ] DBスキーマ導入（最小）：
  - [ ] `bookmarks`
  - [ ] `comments`（後続で利用、空でもよい）
- [ ] RLS：`bookmarks` は owner_user_id = auth.uid() のみ参照/更新可
- [ ] API：`POST /api/bookmarks`, `GET /api/bookmarks`（自分のみ）
- [ ] UI：ログイン→ブックマーク一覧（自分のみ）が見える
- [ ] UI：ブックマーク作成フォーム（URLのみで可）

成果物（確認方法）：
- ログイン後に自分のブックマークを作成・一覧表示できる（ローカル/Workers両方）

---

## Iteration 3（PR#3）ブックマーク詳細＋メモ（MVP完成）
目的：個人利用MVPを完成させる（保存・閲覧・メモ・最低限の情報取得）。

- [ ] API：`GET /api/bookmarks/:id`（自分のみ）
- [ ] API：`PATCH /api/bookmarks/:id`（`note`更新）
- [ ] UI：ブックマーク詳細ページ（URL/タイトル/ノート）
- [ ] UI：ノート編集（保存→反映）
- [ ] メタ取得（任意・軽量）：
  - [ ] Workers側でタイトル取得の簡易実装 or UIで入力任意のまま
- [ ] エラーハンドリング（404/401）と基本UI

成果物（確認方法）：
- ブックマーク詳細でノート更新まで動作（ローカル/Workers）

---

## Iteration 4（PR#4）コメント（自由記述）＋フラット表示（MVP拡張）
目的：リンクに対する「人の意見」を蓄積できる状態。議論化を避ける最低限制約を入れる。

- [ ] DB：`comments` スキーマ確定（bookmark_id, author_user_id, body, visibility, mod_status）
- [ ] RLS：ブックマークにアクセス可能なユーザーのみコメント作成可（当面は自分のbookmarkのみでOK）
- [ ] API：`POST /api/bookmarks/:id/comments`（自由記述）
- [ ] API：`GET /api/bookmarks/:id/comments`（allowedのみ。自分はallでも可は後回し可）
- [ ] UI：ブックマーク詳細にコメント投稿欄＋一覧（フラット、返信なし）
- [ ] UI：コメント削除（自分のコメントのみ）※任意、入れるならこのPRで

成果物（確認方法）：
- ブックマーク詳細でコメントの投稿・閲覧ができる（ローカル/Workers）

---

## Iteration 5（PR#5）AIモデレーション（コメントスパム/攻撃性）＋可視化制御
目的：コメント自由を維持しつつ、表示レイヤーで荒れを抑制する。

- [ ] OpenAI Moderation API 呼び出し実装（API側）
- [ ] `comment_moderation` テーブル追加（flagged, category_scores, decision, evaluated_at）
- [ ] コメント作成時：
  - [ ] `pending` → モデレーション → `allowed/hidden/needs_review`
- [ ] `GET comments` は `allowed` のみ返す（ownerは `all` 返却を追加してもOK）
- [ ] UI：
  - [ ] 投稿後「審査中/非表示」状態を表示
  - [ ] owner向けにhidden表示のトグル（任意、入れるなら最小で）
- [ ] 環境変数：OpenAI Key、閾値設定（`.env.example`/Secrets）

成果物（確認方法）：
- 攻撃的/スパム相当のコメントは表示されない（ローカル/Workers）

---

## Iteration 6（PR#6）公開範囲（visibility）基盤：friends/followers/public（段階導入）
目的：ソーシャルブックマークとしての公開モデルを導入（まずはpublicのみでもよい）。

- [ ] DB：`friends`/`friend_requests` テーブル追加（相互承認）
- [ ] DB：`follows`（user/channelを後で使うが、まずuserのみでも可）
- [ ] `bookmarks.visibility` の扱い確定（default: friends）
- [ ] API：ブックマーク作成時のvisibility指定
- [ ] API：閲覧権限判定（自分、友達、フォロワー、public）
- [ ] UI：ブックマーク作成/詳細でvisibility切替
- [ ] UI：友達申請/承認（最小UI）
- [ ] UI：フォロー（ユーザー）最小UI（相互でなくてもOK）

成果物（確認方法）：
- 友達/フォロー関係に応じてブックマークが見える/見えない（ローカル/Workers）

---

## Iteration 7（PR#7）チャンネル（最小）＋フォロー＋閲覧者アクション（いいね/保存）
目的：個人のブックマークを束ねて見せる「キュレーション軸」を最小で成立させる。

- [ ] DB：`channels`, `channel_items`
- [ ] API：
  - [ ] `POST /api/channels`
  - [ ] `GET /api/channels/:handle`
  - [ ] `POST /api/channels/:id/items`（既存bookmarkを追加）
- [ ] UI：
  - [ ] チャンネル作成
  - [ ] チャンネルページ（一覧表示）
  - [ ] チャンネルへbookmark追加（自分のbookmarkから）
- [ ] いいね/保存（閲覧者側）最小：
  - [ ] DB：`likes`, `saves`
  - [ ] API：`POST /api/likes`, `POST /api/saves`
  - [ ] UI：いいね/保存ボタン（保存時メモ可）

成果物（確認方法）：
- チャンネルを作成し、bookmarkを束ねて公開し、他ユーザーが保存できる（ローカル/Workers）

---

## Iteration 8（PR#8）チャンネルコメントポリシー（ON/OFF）＋企業向け既定
目的：企業・組織利用を見据え、チャンネル単位でコメント可否を制御可能にする。

- [ ] `channels.comment_policy`（on/off）追加
- [ ] API：`PATCH /api/channels/:id`（ownerのみ）
- [ ] コメント投稿APIで `comment_policy == off` の場合は403
- [ ] UI：チャンネル設定画面（comment on/off）
- [ ] UI：comment off の表示（コメント欄を出さない）

成果物（確認方法）：
- チャンネル単位でコメントを完全停止できる（ローカル/Workers）

---

## Iteration 9（PR#9）フィード（フォロー反映）＋おすすめ（ルールベース）
目的：日常的に開ける体験を作る（ソーシャル面の最小ループ）。

- [ ] API：`GET /api/feed`（フォローしているユーザー/チャンネルの新着）
- [ ] UI：ホームにフィード表示
- [ ] API：`GET /api/recommendations`（簡易：最近のタグ/保存傾向＋人気）
- [ ] UI：おすすめ枠を追加
- [ ] 露出制御（最小）：public中心、friends/followersも加味

成果物（確認方法）：
- フォローするとホームフィードが変わり、おすすめが表示される（ローカル/Workers）

---

## Iteration 10（PR#10）MCP（検索・質問応答）最小実装
目的：AI機能の中核（ブックマークに質問）を動作可能にする。

- [ ] API（MCPエンドポイント）：
  - [ ] `POST /api/mcp/search_bookmarks`
  - [ ] `POST /api/mcp/ask_bookmarks`
  - [ ] `GET /api/mcp/bookmarks/:id`
- [ ] 検索（MVP）：
  - [ ] キーワード検索（title/url/note/comment）※SQL ILIKEで可
- [ ] 質問応答（MVP）：
  - [ ] 取得した候補（上位N件）をコンテキストにして回答生成
  - [ ] 根拠（bookmark_id/comment_id）を返す
- [ ] UI（任意だが確認容易にするため推奨）：
  - [ ] 「自分のブックマークに質問」ページを追加（内部MCP呼び出しでも可）
- [ ] 権限制御：ユーザーが閲覧可能な範囲のみを対象にする

成果物（確認方法）：
- ブックマーク群に対して質問でき、根拠付きで回答が返る（ローカル/Workers）

---

## Iteration 11（PR#11）組織（Org）コンテキスト最小
目的：個人＋組織（複数所属）を前提としたデータ所有・閲覧モデルを導入する。

- [ ] DB：`orgs`, `org_members`
- [ ] UI：コンテキスト切替（Personal / Org）
- [ ] Bookmarkのownerを `owner_user_id` / `owner_org_id` の二択で保存
- [ ] RLS：Org owner/memberに基づく参照/更新
- [ ] ChannelもOrg所有可能に拡張（owner_org_id）
- [ ] 企業既定テンプレ（設定値）：
  - [ ] Orgチャンネル comment_policy = off（既定）

成果物（確認方法）：
- Orgコンテキストでブックマーク・チャンネルを作り、メンバーで共有できる（ローカル/Workers）

---

## Iteration 12（PR#12）OSS配布品質（compose改善）＋運用ドキュメント
目的：OSS版を「第三者が動かせる」レベルへ。

- [ ] `docker-compose.yml` の整理（profiles/volumes/healthcheck）
- [ ] 初期化スクリプト（DB migration seed、管理ユーザー作成）
- [ ] README：ローカル起動〜デプロイ差分、環境変数一覧、トラブルシュート
- [ ] ライセンス/コントリビューションガイド
- [ ] サンプルデータ投入オプション

成果物（確認方法）：
- README通りに第三者がOSS版を起動・確認できる
