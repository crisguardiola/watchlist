import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { userPreferences } from '$lib/server/db/schema';
import { getMovieGenres, getMovieById } from '$lib/server/tmdb';
import type { TmdbMovieResult } from '$lib/server/tmdb';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const [prefs] = await db
		.select()
		.from(userPreferences)
		.where(eq(userPreferences.userId, event.locals.user.id));

	const [genres, ...favoriteMovies] = await Promise.all([
		getMovieGenres(),
		...((prefs?.favoriteMovieIds ?? []) as number[]).map((id) => getMovieById(id))
	]);

	const favoriteMoviesList: TmdbMovieResult[] = favoriteMovies.filter(
		(m): m is TmdbMovieResult => m !== null
	);

	return {
		user: event.locals.user,
		preferences: prefs ?? null,
		genres,
		favoriteMovies: favoriteMoviesList
	};
};

export const actions: Actions = {
	updatePreferences: async (event) => {
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
					favoriteMovieIds
				}
			});

		return {};
	}
};
