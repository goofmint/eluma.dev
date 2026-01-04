-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    note TEXT,
    visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('friends', 'followers', 'public', 'org')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments table (minimal for now, will be expanded later)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bookmark_id UUID NOT NULL REFERENCES public.bookmarks(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL,
    body TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('friends', 'followers', 'public', 'org')),
    mod_status TEXT NOT NULL DEFAULT 'pending' CHECK (mod_status IN ('pending', 'allowed', 'hidden', 'needs_review')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_owner_user_id ON public.bookmarks(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_bookmark_id ON public.comments(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_user_id ON public.comments(author_user_id);

-- Enable Row Level Security
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Grant table permissions to roles
GRANT ALL ON public.bookmarks TO authenticated;
GRANT SELECT ON public.bookmarks TO anon;
GRANT ALL ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;

-- RLS Policies for bookmarks
-- Users can only see their own bookmarks (for MVP, will expand later for visibility)
CREATE POLICY bookmarks_select_own ON public.bookmarks
    FOR SELECT
    TO authenticated
    USING (owner_user_id = auth.uid());

CREATE POLICY bookmarks_insert_own ON public.bookmarks
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY bookmarks_update_own ON public.bookmarks
    FOR UPDATE
    TO authenticated
    USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY bookmarks_delete_own ON public.bookmarks
    FOR DELETE
    TO authenticated
    USING (owner_user_id = auth.uid());

-- RLS Policies for comments (MVP: owner of bookmark can see all their bookmark's comments)
CREATE POLICY comments_select_own ON public.comments
    FOR SELECT
    TO authenticated
    USING (
        author_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.bookmarks b
            WHERE b.id = bookmark_id AND b.owner_user_id = auth.uid()
        )
    );

CREATE POLICY comments_insert_own ON public.comments
    FOR INSERT
    TO authenticated
    WITH CHECK (author_user_id = auth.uid());

CREATE POLICY comments_update_own ON public.comments
    FOR UPDATE
    TO authenticated
    USING (author_user_id = auth.uid())
    WITH CHECK (author_user_id = auth.uid());

CREATE POLICY comments_delete_own ON public.comments
    FOR DELETE
    TO authenticated
    USING (author_user_id = auth.uid());

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS bookmarks_updated_at ON public.bookmarks;
CREATE TRIGGER bookmarks_updated_at
    BEFORE UPDATE ON public.bookmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS comments_updated_at ON public.comments;
CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
