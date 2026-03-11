import { fail, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { userPreferences, watchlist } from '$lib/server/db/schema';
import { getMovieById, getTvDetails, getMovieGenres } from '$lib/server/tmdb';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const [moviesRows, prefsRows, genres] = await Promise.all([
		db
			.select()
			.from(watchlist)
			.where(eq(watchlist.userId, event.locals.user.id))
			.orderBy(desc(watchlist.createdAt)),
		db
			.select()
			.from(userPreferences)
			.where(eq(userPreferences.userId, event.locals.user.id)),
		getMovieGenres()
	]);

	const movies = moviesRows;
	const prefs = prefsRows[0] ?? null;

	const genreIds = (prefs?.genreIds ?? []) as number[];
	const favoriteMovieIds = (prefs?.favoriteMovieIds ?? []) as number[];
	const hasPreferences = genreIds.length > 0 || favoriteMovieIds.length > 0;

	return { user: event.locals.user, movies, hasPreferences, genres };
};

export const actions: Actions = {
	addMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const title = formData.get('title')?.toString()?.trim() ?? '';
		const posterPath = formData.get('poster_path')?.toString()?.trim() || null;
		const statusRaw = formData.get('status')?.toString() ?? 'want_to_watch';
		const status =
			statusRaw === 'watching' || statusRaw === 'watched' ? statusRaw : 'want_to_watch';

		// Genre IDs from form (recommendations) or from TMDB fetch (search)
		let genreIds: number[] = [];
		const genreIdsForm = formData.getAll('genreIds');
		if (genreIdsForm.length > 0) {
			genreIds = genreIdsForm
				.map((v) => Number(v))
				.filter((n) => Number.isInteger(n) && n > 0);
		} else {
			const tmdbIdRaw = formData.get('tmdb_id');
			const mediaType = formData.get('media_type')?.toString();
			if (tmdbIdRaw != null && tmdbIdRaw !== '') {
				const tmdbId = Number(tmdbIdRaw);
				if (Number.isInteger(tmdbId) && tmdbId > 0) {
					if (mediaType === 'tv') {
						const tv = await getTvDetails(tmdbId);
						if (tv?.genreIds) genreIds = tv.genreIds;
					} else {
						const movie = await getMovieById(tmdbId);
						if (movie?.genreIds) genreIds = movie.genreIds;
					}
				}
			}
		}

		if (!title) {
			return fail(400, { message: 'Title is required' });
		}

		await db.insert(watchlist).values({
			userId: event.locals.user.id,
			title,
			posterPath,
			status,
			genreIds
		});

		return {};
	},
		deleteMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));

		if (!Number.isInteger(id) || id < 1) {
			return fail(400, { message: 'Invalid movie' });
		}

		await db
			.delete(watchlist)
			.where(and(eq(watchlist.id, id), eq(watchlist.userId, event.locals.user.id)));

		return {};
	},
	updateStatus: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));
		const statusRaw = formData.get('status')?.toString() ?? 'want_to_watch';
		const status =
			statusRaw === 'watching' || statusRaw === 'watched' ? statusRaw : 'want_to_watch';

		if (!Number.isInteger(id) || id < 1) {
			return fail(400, { message: 'Invalid movie' });
		}

		await db
			.update(watchlist)
			.set({ status })
			.where(and(eq(watchlist.id, id), eq(watchlist.userId, event.locals.user.id)));

		return {};
	},
	updateRating: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));
		const ratingRaw = formData.get('rating');
		let rating: number | null = null;
		if (ratingRaw !== null && ratingRaw !== '' && ratingRaw !== '0') {
			const n = Number(ratingRaw);
			if (n >= 1 && n <= 5) rating = n;
		}

		if (!Number.isInteger(id) || id < 1) {
			return fail(400, { message: 'Invalid movie' });
		}

		await db
			.update(watchlist)
			.set({ rating })
			.where(and(eq(watchlist.id, id), eq(watchlist.userId, event.locals.user.id)));

		return {};
	}
};
