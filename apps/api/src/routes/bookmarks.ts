import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { getDbClient, isNodeEnv } from '../lib/db';
import { createSupabaseClient, getEnv } from '../lib/supabase';
import { authMiddleware, requireUser } from '../middleware/auth';
import type { AppEnv, Bookmark } from '../types';
import {
  BookmarkSchema,
  BookmarkListSchema,
  CreateBookmarkSchema,
  ErrorResponseSchema,
} from '../types';

const bookmarks = new OpenAPIHono<AppEnv>();

// Apply auth middleware to all bookmark routes
bookmarks.use('*', authMiddleware);

// List bookmarks route
const listBookmarksRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Bookmarks'],
  summary: 'List your bookmarks',
  description: 'Returns all bookmarks owned by the authenticated user',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: BookmarkListSchema } },
      description: 'List of bookmarks',
    },
    401: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Unauthorized',
    },
    500: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Internal server error',
    },
  },
});

bookmarks.openapi(listBookmarksRoute, async (c) => {
  const user = requireUser(c);

  // Use direct PostgreSQL for self-hosted mode
  if (isNodeEnv() && getEnv(c, 'DATABASE_URL')) {
    const db = await getDbClient(c);
    try {
      const data = await db.query<Bookmark>(
        `SELECT id, owner_user_id, url, title, note, visibility, created_at, updated_at
         FROM public.bookmarks
         WHERE owner_user_id = $1
         ORDER BY created_at DESC`,
        [user.id]
      );
      return c.json(data, 200);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      return c.json({ error: 'Failed to fetch bookmarks', code: 'DB_ERROR' }, 500);
    } finally {
      await db.close();
    }
  }

  // Use Supabase client for production (with PostgREST)
  const token = c.get('accessToken');
  const supabase = createSupabaseClient(c, token);

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch bookmarks:', error);
    return c.json({ error: 'Failed to fetch bookmarks', code: 'DB_ERROR' }, 500);
  }

  return c.json((data || []) as Bookmark[], 200);
});

// Create bookmark route
const createBookmarkRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Bookmarks'],
  summary: 'Create a bookmark',
  description: 'Create a new bookmark for the authenticated user',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CreateBookmarkSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: BookmarkSchema } },
      description: 'Bookmark created',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Invalid request',
    },
    401: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Unauthorized',
    },
    500: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Internal server error',
    },
  },
});

bookmarks.openapi(createBookmarkRoute, async (c) => {
  const user = requireUser(c);
  const body = c.req.valid('json');

  // Use direct PostgreSQL for self-hosted mode
  if (isNodeEnv() && getEnv(c, 'DATABASE_URL')) {
    const db = await getDbClient(c);
    try {
      const data = await db.queryOne<Bookmark>(
        `INSERT INTO public.bookmarks (owner_user_id, url, title, note, visibility)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, owner_user_id, url, title, note, visibility, created_at, updated_at`,
        [user.id, body.url, body.title || null, body.note || null, body.visibility || 'friends']
      );
      if (!data) {
        return c.json({ error: 'Failed to create bookmark', code: 'DB_ERROR' }, 500);
      }
      return c.json(data, 201);
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      return c.json({ error: 'Failed to create bookmark', code: 'DB_ERROR' }, 500);
    } finally {
      await db.close();
    }
  }

  // Use Supabase client for production (with PostgREST)
  const token = c.get('accessToken');
  const supabase = createSupabaseClient(c, token);

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      owner_user_id: user.id,
      url: body.url,
      title: body.title || null,
      note: body.note || null,
      visibility: body.visibility || 'friends',
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to create bookmark:', error);
    return c.json({ error: 'Failed to create bookmark', code: 'DB_ERROR' }, 500);
  }

  return c.json(data as Bookmark, 201);
});

// Get single bookmark route
const getBookmarkRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Bookmarks'],
  summary: 'Get a bookmark',
  description: 'Get a specific bookmark by ID',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: BookmarkSchema } },
      description: 'Bookmark details',
    },
    401: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Unauthorized',
    },
    404: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Bookmark not found',
    },
    500: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Internal server error',
    },
  },
});

bookmarks.openapi(getBookmarkRoute, async (c) => {
  const user = requireUser(c);
  const id = c.req.param('id');

  // Use direct PostgreSQL for self-hosted mode
  if (isNodeEnv() && getEnv(c, 'DATABASE_URL')) {
    const db = await getDbClient(c);
    try {
      const data = await db.queryOne<Bookmark>(
        `SELECT id, owner_user_id, url, title, note, visibility, created_at, updated_at
         FROM public.bookmarks
         WHERE id = $1 AND owner_user_id = $2`,
        [id, user.id]
      );
      if (!data) {
        return c.json({ error: 'Bookmark not found', code: 'NOT_FOUND' }, 404);
      }
      return c.json(data, 200);
    } catch (error) {
      console.error('Failed to fetch bookmark:', error);
      return c.json({ error: 'Failed to fetch bookmark', code: 'DB_ERROR' }, 500);
    } finally {
      await db.close();
    }
  }

  // Use Supabase client for production (with PostgREST)
  const token = c.get('accessToken');
  const supabase = createSupabaseClient(c, token);

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single();

  if (error || !data) {
    return c.json({ error: 'Bookmark not found', code: 'NOT_FOUND' }, 404);
  }

  return c.json(data as Bookmark, 200);
});

export default bookmarks;
