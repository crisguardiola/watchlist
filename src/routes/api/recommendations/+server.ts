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

	const url = new URL(event.request.url);
	const countParam = url.searchParams.get('count');
	const excludeParam = url.searchParams.get('exclude');
	const maxCount = countParam ? Math.min(Math.max(1, Number(countParam)), MAX_RECOMMENDATIONS) : MAX_RECOMMENDATIONS;
	const excludeIds = excludeParam
		? new Set(excludeParam.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0))
		: new Set<number>();

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

	const seenIds = new Set<number>([...excludeIds]);
	const results: TmdbMovieResult[] = [];

	const addIfValid = (m: TmdbMovieResult) => {
		if (!seenIds.has(m.id) && !watchlistTitles.has(m.title.toLowerCase().trim())) {
			seenIds.add(m.id);
			results.push(m);
			return true;
		}
		return false;
	};

	if (genreIds.length > 0) {
		for (let page = 1; results.length < maxCount && page <= 5; page++) {
			const discovered = await discoverMoviesByGenres(genreIds, page);
			for (const m of discovered) {
				addIfValid(m);
				if (results.length >= maxCount) break;
			}
		}
	}

	for (const movieId of favoriteMovieIds) {
		if (results.length >= maxCount) break;
		const recs = await getMovieRecommendations(movieId, 1);
		for (const m of recs) {
			addIfValid(m);
			if (results.length >= maxCount) break;
		}
	}

	const recommendations: RecommendationWithGenre[] = results.map((m) => ({
		...m,
		genreNames: (m.genreIds ?? []).map((id) => genreMap.get(id) ?? '').filter(Boolean)
	}));

	return json({ recommendations });
};
