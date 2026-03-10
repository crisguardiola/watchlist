import { env } from '$env/dynamic/private';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export interface TmdbSearchResult {
	id: number;
	title: string;
	posterPath: string;
	mediaType: 'movie' | 'tv';
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
