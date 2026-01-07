import { pgEnum, pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

// Enum for visibility levels
export const visibilityEnum = pgEnum('visibility', [
  'friends',
  'followers',
  'public',
  'org',
]);

// Enum for moderation status
export const modStatusEnum = pgEnum('mod_status', [
  'pending',
  'approved',
  'rejected',
]);

export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: uuid('owner_user_id').notNull(),
  url: text('url').notNull(),
  title: text('title'),
  note: text('note'),
  visibility: visibilityEnum('visibility').notNull().default('friends'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookmarkId: uuid('bookmark_id').notNull().references(() => bookmarks.id, { onDelete: 'cascade' }),
  authorUserId: uuid('author_user_id').notNull(),
  body: text('body').notNull(),
  visibility: visibilityEnum('visibility').notNull().default('friends'),
  modStatus: modStatusEnum('mod_status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
