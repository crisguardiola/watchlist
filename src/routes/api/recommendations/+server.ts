import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { userPreferences, watchlist } from '$lib/server/db/schema';
import {
	discoverMoviesByGenres,
	getMovieRecommendations,
	type TmdbMovieResult
} from '$lib/server/tmdb';

const MAX_RECOMMENDATIONS = 25;

export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) {
		return json({ recommendations: [] }, { status: 401 });
	}

	const [prefs] = await db
		.select()
		.from(userPreferences)
		.where(eq(userPreferences.userId, user.id));

	const genreIds = (prefs?.genreIds ?? []) as number[];
	const favoriteMovieIds = (prefs?.favoriteMovieIds ?? []) as number[];

	if (genreIds.length === 0 && favoriteMovieIds.length === 0) {
		return json({ recommendations: [] });
	}

	const watchlistItems = await db
		.select({ title: watchlist.title })
		.from(watchlist)
		.where(eq(watchlist.userId, user.id));
	const watchlistTitles = new Set(
		watchlistItems.map((w) => w.title?.toLowerCase().trim()).filter(Boolean)
	);

	const seenIds = new Set<number>();
	const results: TmdbMovieResult[] = [];

	if (genreIds.length > 0) {
		const discovered = await discoverMoviesByGenres(genreIds, 1);
		for (const m of discovered) {
			if (!seenIds.has(m.id) && !watchlistTitles.has(m.title.toLowerCase().trim())) {
				seenIds.add(m.id);
				results.push(m);
				if (results.length >= MAX_RECOMMENDATIONS) break;
			}
		}
	}

	for (const movieId of favoriteMovieIds) {
		if (results.length >= MAX_RECOMMENDATIONS) break;
		const recs = await getMovieRecommendations(movieId, 1);
		for (const m of recs) {
			if (!seenIds.has(m.id) && !watchlistTitles.has(m.title.toLowerCase().trim())) {
				seenIds.add(m.id);
				results.push(m);
				if (results.length >= MAX_RECOMMENDATIONS) break;
			}
		}
	}

	return json({ recommendations: results });
};
