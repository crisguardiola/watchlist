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
	const data = (await tmdbFetch<{ id: number; title?: string; poster_path: string | null }>(
		`/movie/${movieId}`
	)) as { id: number; title?: string; poster_path: string | null } | null;
	if (!data?.poster_path) return null;
	return {
		id: data.id,
		title: (data.title ?? '').trim() || 'Unknown',
		posterPath: data.poster_path,
		mediaType: 'movie'
	};
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
