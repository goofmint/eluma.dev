import { z } from '@hono/zod-openapi';

// String-based environment bindings (for getEnv helper)
export type StringBindings = {
  ALLOWED_ORIGINS?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  SUPABASE_PROJECT_REF?: string;
  JWT_SECRET?: string;
  DATABASE_URL?: string;
};

// Environment bindings for Cloudflare Workers (includes non-string bindings)
export type Bindings = StringBindings & {
  HYPERDRIVE?: Hyperdrive;
};

// User context from JWT
export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

// Variables passed through context
export type Variables = {
  user?: AuthUser;
  accessToken?: string;
};

// App environment type
export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

// Bookmark schemas
export const BookmarkSchema = z
  .object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    owner_user_id: z.string().uuid(),
    url: z.string().url().openapi({ example: 'https://example.com' }),
    title: z.string().nullable().openapi({ example: 'Example Website' }),
    note: z.string().nullable().openapi({ example: 'My notes about this page' }),
    visibility: z.enum(['friends', 'followers', 'public', 'org']).openapi({ example: 'friends' }),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .openapi('Bookmark');

export const CreateBookmarkSchema = z
  .object({
    url: z.string().url().openapi({ example: 'https://example.com' }),
    title: z.string().optional().openapi({ example: 'Example Website' }),
    note: z.string().optional().openapi({ example: 'My notes about this page' }),
    visibility: z.enum(['friends', 'followers', 'public', 'org']).optional().default('friends'),
  })
  .openapi('CreateBookmark');

export const BookmarkListSchema = z.array(BookmarkSchema).openapi('BookmarkList');

// Error response schema
export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: 'Error message' }),
    code: z.string().optional().openapi({ example: 'UNAUTHORIZED' }),
  })
  .openapi('ErrorResponse');

// Type exports
export type Bookmark = z.infer<typeof BookmarkSchema>;
export type CreateBookmark = z.infer<typeof CreateBookmarkSchema>;
