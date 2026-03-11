import { pgEnum, pgTable, serial, integer, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

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
	genreIds: jsonb('genre_ids').$type<number[]>().default([]).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const userPreferences = pgTable('user_preferences', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	genreIds: jsonb('genre_ids').$type<number[]>().default([]).notNull(),
	favoriteMovieIds: jsonb('favorite_movie_ids').$type<number[]>().default([]).notNull(),
	onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export * from './auth.schema';
