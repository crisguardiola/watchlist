import { fail, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { watchlist } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const movies = await db
		.select()
		.from(watchlist)
		.where(eq(watchlist.userId, event.locals.user.id))
		.orderBy(desc(watchlist.createdAt));

	return { user: event.locals.user, movies };
};

export const actions: Actions = {
	addMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const title = formData.get('title')?.toString()?.trim() ?? '';

		if (!title) {
			return fail(400, { message: 'Title is required' });
		}

		await db.insert(watchlist).values({
			userId: event.locals.user.id,
			title
		});

		return {};
	},
	deleteMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));

		if (!Number.isInteger(id) || id < 1) {
			return fail(400, { message: 'Invalid movie' });
		}

		await db
			.delete(watchlist)
			.where(and(eq(watchlist.id, id), eq(watchlist.userId, event.locals.user.id)));

		return {};
	},
	signOut: async (event) => {
		await auth.api.signOut({
			headers: event.request.headers
		});
		return redirect(302, '/login');
	}
};
