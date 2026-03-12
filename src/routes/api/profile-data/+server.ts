import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { userPreferences } from '$lib/server/db/schema';
import { getMovieGenres, getMovieById } from '$lib/server/tmdb';
import type { TmdbMovieResult } from '$lib/server/tmdb';

export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const [prefs] = await db
		.select()
		.from(userPreferences)
		.where(eq(userPreferences.userId, user.id));

	const [genres, ...favoriteMovies] = await Promise.all([
		getMovieGenres(),
		...((prefs?.favoriteMovieIds ?? []) as number[]).map((id) => getMovieById(id))
	]);

	const favoriteMoviesList: TmdbMovieResult[] = favoriteMovies.filter(
		(m): m is TmdbMovieResult => m !== null
	);

	return json({
		preferences: prefs ?? null,
		genres,
		favoriteMovies: favoriteMoviesList
	});
};
