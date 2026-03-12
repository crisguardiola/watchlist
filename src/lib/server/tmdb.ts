import { env } from '$env/dynamic/private';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export interface TmdbSearchResult {
	id: number;
	title: string;
	posterPath: string;
	mediaType: 'movie' | 'tv';
}

export interface TmdbGenre {
	id: number;
	name: string;
}

export interface TmdbMovieResult {
	id: number;
	title: string;
	posterPath: string;
	mediaType: 'movie';
	genreIds?: number[];
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
	const apiKey = env.TMDB_API_KEY;
	if (!apiKey?.trim()) {
		console.error('[TMDB] TMDB_API_KEY is not set in environment');
		return null;
	}
	const url = new URL(`${TMDB_BASE}${path}`);
	url.searchParams.set('language', 'en-US');
	for (const [k, v] of Object.entries(params)) {
		if (v) url.searchParams.set(k, v);
	}
	const res = await fetch(url.toString(), {
		headers: {
			Accept: 'application/json',
			Authorization: `Bearer ${apiKey}`
		}
	});
	if (!res.ok) {
		const errBody = await res.text();
		console.error('[TMDB] API error:', res.status, res.statusText, errBody.slice(0, 200));
		return null;
	}
	return res.json() as Promise<T>;
}

export async function searchTmdb(query: string): Promise<TmdbSearchResult[]> {
	const apiKey = env.TMDB_API_KEY;
	if (!apiKey?.trim()) {
		console.error('[TMDB] TMDB_API_KEY is not set in environment');
		return [];
	}

	const url = new URL(`${TMDB_BASE}/search/multi`);
	url.searchParams.set('query', query.trim());
	url.searchParams.set('include_adult', 'false');
	url.searchParams.set('language', 'en-US');

	const res = await fetch(url.toString(), {
		headers: {
			Accept: 'application/json',
			Authorization: `Bearer ${apiKey}`
		}
	});

	if (!res.ok) {
		const errBody = await res.text();
		console.error('[TMDB] API error:', res.status, res.statusText, errBody.slice(0, 200));
		return [];
	}

	const data = (await res.json()) as {
		results?: Array<{
			id: number;
			title?: string;
			name?: string;
			poster_path: string | null;
			media_type: string;
		}>;
	};

	const results = data.results ?? [];
	return results
		.filter((r) => r.poster_path && (r.media_type === 'movie' || r.media_type === 'tv'))
		.map((r) => ({
			id: r.id,
			title: (r.title ?? r.name ?? '').trim() || 'Unknown',
			posterPath: r.poster_path!,
			mediaType: r.media_type as 'movie' | 'tv'
		}));
}

export async function getMovieGenres(): Promise<TmdbGenre[]> {
	const data = (await tmdbFetch<{ genres?: Array<{ id: number; name: string }> }>(
		'/genre/movie/list'
	)) as { genres?: Array<{ id: number; name: string }> } | null;
	if (!data?.genres) return [];
	return data.genres;
}

export async function discoverMoviesByGenres(
	genreIds: number[],
	page = 1
): Promise<TmdbMovieResult[]> {
	if (genreIds.length === 0) return [];
	const data = (await tmdbFetch<{
		results?: Array<{
			id: number;
			title?: string;
			poster_path: string | null;
			genre_ids?: number[];
		}>;
	}>('/discover/movie', {
		with_genres: genreIds.join(','),
		sort_by: 'popularity.desc',
		include_adult: 'false',
		page: String(page)
	})) as {
		results?: Array<{
			id: number;
			title?: string;
			poster_path: string | null;
			genre_ids?: number[];
		}>;
	} | null;
	if (!data?.results) return [];
	return data.results
		.filter((r) => r.poster_path)
		.map((r) => ({
			id: r.id,
			title: (r.title ?? '').trim() || 'Unknown',
			posterPath: r.poster_path!,
			mediaType: 'movie' as const,
			genreIds: r.genre_ids ?? []
		}));
}

export async function getMovieById(movieId: number): Promise<TmdbMovieResult | null> {
	const data = (await tmdbFetch<{
		id: number;
		title?: string;
		poster_path: string | null;
		genres?: Array<{ id: number; name: string }>;
	}>(`/movie/${movieId}`)) as {
		id: number;
		title?: string;
		poster_path: string | null;
		genres?: Array<{ id: number; name: string }>;
	} | null;
	if (!data?.poster_path) return null;
	const genreIds = (data.genres ?? []).map((g) => g.id);
	return {
		id: data.id,
		title: (data.title ?? '').trim() || 'Unknown',
		posterPath: data.poster_path,
		mediaType: 'movie',
		genreIds
	};
}

export async function getTvDetails(tvId: number): Promise<{
	id: number;
	title: string;
	posterPath: string | null;
	genreIds: number[];
} | null> {
	const data = (await tmdbFetch<{
		id: number;
		name?: string;
		poster_path: string | null;
		genres?: Array<{ id: number; name: string }>;
	}>(`/tv/${tvId}`)) as {
		id: number;
		name?: string;
		poster_path: string | null;
		genres?: Array<{ id: number; name: string }>;
	} | null;
	if (!data?.poster_path) return null;
	const genreIds = (data.genres ?? []).map((g) => g.id);
	return {
		id: data.id,
		title: (data.name ?? '').trim() || 'Unknown',
		posterPath: data.poster_path,
		genreIds
	};
}

/** Curated movies for login/landing pages when TMDB API is unavailable */
const FALLBACK_MOVIES: Array<{ title: string; posterPath: string }> = [
	{ title: 'Inception', posterPath: '/9gk7adHYeDvHkCSEqAvQNLV5u3z.jpg' },
	{ title: 'The Dark Knight', posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
	{ title: 'Interstellar', posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
	{ title: 'Pulp Fiction', posterPath: '/d5iIlFn5s0ImszYzBPb8PIfeqI3.jpg' },
	{ title: 'The Shawshank Redemption', posterPath: '/q6y0Go1tsGEsmtKryCrAiBBOfXO2.jpg' },
	{ title: 'Forrest Gump', posterPath: '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg' },
	{ title: 'The Godfather', posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg' },
	{ title: 'The Matrix', posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' }
];

export async function getTrendingMovies(limit = 8): Promise<Array<{ title: string; posterPath: string }>> {
	const data = (await tmdbFetch<{
		results?: Array<{ title?: string; poster_path: string | null }>;
	}>('/trending/movie/week')) as {
		results?: Array<{ title?: string; poster_path: string | null }>;
	} | null;
	if (!data?.results?.length) return FALLBACK_MOVIES.slice(0, limit);
	return data.results
		.filter((r) => r.poster_path && (r.title ?? '').trim())
		.slice(0, limit)
		.map((r) => ({ title: (r.title ?? '').trim(), posterPath: r.poster_path! }));
}

export async function getMovieRecommendations(
	movieId: number,
	page = 1
): Promise<TmdbMovieResult[]> {
	const data = (await tmdbFetch<{
		results?: Array<{
			id: number;
			title?: string;
			poster_path: string | null;
			genre_ids?: number[];
		}>;
	}>(`/movie/${movieId}/recommendations`, { page: String(page) })) as {
		results?: Array<{
			id: number;
			title?: string;
			poster_path: string | null;
			genre_ids?: number[];
		}>;
	} | null;
	if (!data?.results) return [];
	return data.results
		.filter((r) => r.poster_path)
		.map((r) => ({
			id: r.id,
			title: (r.title ?? '').trim() || 'Unknown',
			posterPath: r.poster_path!,
			mediaType: 'movie' as const,
			genreIds: r.genre_ids ?? []
		}));
}
