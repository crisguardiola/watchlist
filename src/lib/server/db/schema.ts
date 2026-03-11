import { pgEnum, pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const watchlistStatusEnum = pgEnum('watchlist_status', [
	'want_to_watch',
	'watching',
	'watched'
]);

export const watchlist = pgTable('watchlist', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	title: text('title').notNull(),
	posterPath: text('poster_path'),
	status: watchlistStatusEnum('status').notNull().default('want_to_watch'),
	rating: integer('rating'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export * from './auth.schema';
