import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchTmdb } from '$lib/server/tmdb';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 2) {
		return json({ results: [] });
	}

	const results = await searchTmdb(q);
	return json({ results });
};
