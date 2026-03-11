import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { userPreferences, watchlist } from '$lib/server/db/schema';
import {
	discoverMoviesByGenres,
	getMovieGenres,
	getMovieRecommendations,
	type TmdbMovieResult
} from '$lib/server/tmdb';

const MAX_RECOMMENDATIONS = 25;

export interface RecommendationWithGenre extends TmdbMovieResult {
	genreNames: string[];
}

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

	const [watchlistItems, genres] = await Promise.all([
		db
			.select({ title: watchlist.title })
			.from(watchlist)
			.where(eq(watchlist.userId, user.id)),
		getMovieGenres()
	]);

	const watchlistTitles = new Set(
		watchlistItems.map((w) => w.title?.toLowerCase().trim()).filter(Boolean)
	);
	const genreMap = new Map(genres.map((g) => [g.id, g.name]));

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

	const recommendations: RecommendationWithGenre[] = results.map((m) => ({
		...m,
		genreNames: (m.genreIds ?? []).map((id) => genreMap.get(id) ?? '').filter(Boolean)
	}));

	return json({ recommendations });
};
