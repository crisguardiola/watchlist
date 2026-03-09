import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const watchlist = pgTable(
	'watchlist',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [index('watchlist_userId_idx').on(table.userId)]
);

export * from './auth.schema';
