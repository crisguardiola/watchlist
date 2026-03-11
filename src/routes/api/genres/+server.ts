import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMovieGenres } from '$lib/server/tmdb';

export const GET: RequestHandler = async () => {
	const genres = await getMovieGenres();
	return json({ genres });
};
