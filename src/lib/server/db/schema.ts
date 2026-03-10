import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const watchlist = pgTable('watchlist', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	title: text('title').notNull(),
	posterPath: text('poster_path'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export * from './auth.schema';
