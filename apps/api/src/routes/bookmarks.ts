import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { eq, desc, and } from 'drizzle-orm';
import { getDb, bookmarks } from '../db';
import { authMiddleware, requireUser } from '../middleware/auth';
import type { AppEnv, Bookmark } from '../types';
import {
  BookmarkSchema,
  BookmarkListSchema,
  CreateBookmarkSchema,
  ErrorResponseSchema,
} from '../types';

type Visibility = Bookmark['visibility'];

const bookmarksRouter = new OpenAPIHono<AppEnv>();

// Apply auth middleware to all bookmark routes
bookmarksRouter.use('*', authMiddleware);

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

bookmarksRouter.openapi(listBookmarksRoute, async (c) => {
  const user = requireUser(c);
  const db = getDb(c);

  try {
    const result = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.ownerUserId, user.id))
      .orderBy(desc(bookmarks.createdAt));

    const mapped = result.map((row) => ({
      id: row.id,
      owner_user_id: row.ownerUserId,
      url: row.url,
      title: row.title,
      note: row.note,
      visibility: row.visibility as Visibility,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    }));

    return c.json(mapped, 200);
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error);
    return c.json({ error: 'Failed to fetch bookmarks', code: 'DB_ERROR' }, 500);
  }
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

bookmarksRouter.openapi(createBookmarkRoute, async (c) => {
  const user = requireUser(c);
  const db = getDb(c);
  const body = c.req.valid('json');

  try {
    const [result] = await db
      .insert(bookmarks)
      .values({
        ownerUserId: user.id,
        url: body.url,
        title: body.title || null,
        note: body.note || null,
        visibility: body.visibility || 'friends',
      })
      .returning();

    const mapped = {
      id: result.id,
      owner_user_id: result.ownerUserId,
      url: result.url,
      title: result.title,
      note: result.note,
      visibility: result.visibility as Visibility,
      created_at: result.createdAt.toISOString(),
      updated_at: result.updatedAt.toISOString(),
    };

    return c.json(mapped, 201);
  } catch (error) {
    console.error('Failed to create bookmark:', error);
    return c.json({ error: 'Failed to create bookmark', code: 'DB_ERROR' }, 500);
  }
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

bookmarksRouter.openapi(getBookmarkRoute, async (c) => {
  const user = requireUser(c);
  const db = getDb(c);
  const id = c.req.param('id');

  try {
    const [result] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.ownerUserId, user.id)));

    if (!result) {
      return c.json({ error: 'Bookmark not found', code: 'NOT_FOUND' }, 404);
    }

    const mapped = {
      id: result.id,
      owner_user_id: result.ownerUserId,
      url: result.url,
      title: result.title,
      note: result.note,
      visibility: result.visibility as Visibility,
      created_at: result.createdAt.toISOString(),
      updated_at: result.updatedAt.toISOString(),
    };

    return c.json(mapped, 200);
  } catch (error) {
    console.error('Failed to fetch bookmark:', error);
    return c.json({ error: 'Failed to fetch bookmark', code: 'DB_ERROR' }, 500);
  }
});

export default bookmarksRouter;
