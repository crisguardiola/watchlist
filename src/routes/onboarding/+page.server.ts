import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { userPreferences } from '$lib/server/db/schema';
import { getMovieGenres } from '$lib/server/tmdb';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const [prefs] = await db
		.select()
		.from(userPreferences)
		.where(eq(userPreferences.userId, event.locals.user.id));

	if (prefs?.onboardingCompletedAt) {
		return redirect(302, '/');
	}

	const genres = await getMovieGenres();
	return { genres };
};

export const actions: Actions = {
	savePreferences: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const genreIds = formData
			.getAll('genreIds')
			.map((v) => Number(v))
			.filter((n) => Number.isInteger(n) && n > 0);
		const favoriteMovieIds = formData
			.getAll('favoriteMovieIds')
			.map((v) => Number(v))
			.filter((n) => Number.isInteger(n) && n > 0);

		await db
			.insert(userPreferences)
			.values({
				userId: event.locals.user.id,
				genreIds,
				favoriteMovieIds,
				onboardingCompletedAt: new Date()
			})
			.onConflictDoUpdate({
				target: userPreferences.userId,
				set: {
					genreIds,
					favoriteMovieIds,
					onboardingCompletedAt: new Date()
				}
			});

		return redirect(302, '/');
	},
	skipOnboarding: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		await db
			.insert(userPreferences)
			.values({
				userId: event.locals.user.id,
				genreIds: [],
				favoriteMovieIds: [],
				onboardingCompletedAt: new Date()
			})
			.onConflictDoUpdate({
				target: userPreferences.userId,
				set: {
					onboardingCompletedAt: new Date()
				}
			});

		return redirect(302, '/');
	}
};
