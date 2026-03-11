<script lang="ts">
	import { onMount } from 'svelte';
	import MovieCard from '$lib/components/MovieCard.svelte';
	import WatchlistCard from '$lib/components/WatchlistCard.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	interface Recommendation {
		id: number;
		title: string;
		posterPath: string;
		mediaType: 'movie' | 'tv';
		genreNames?: string[];
		genreIds?: number[];
	}

	type Tab = 'recommendations' | 'watchlist';
	let activeTab = $state<Tab>('recommendations');

	let recommendations = $state<Recommendation[]>([]);
	let recommendationsLoading = $state(true);
	let removingTmdbId = $state<number | null>(null);

	async function refetchRecommendations() {
		try {
			const res = await fetch('/api/recommendations', { credentials: 'include' });
			if (res.ok) {
				const json = await res.json();
				recommendations = json?.recommendations ?? [];
			}
		} catch {
			// Ignore fetch errors
		}
	}

	function handleAddToWatchlist(e: CustomEvent<{ tmdbId?: number }>) {
		const tmdbId = e.detail.tmdbId;
		if (tmdbId == null) return;
		removingTmdbId = tmdbId;
		setTimeout(() => {
			recommendations = recommendations.filter((r) => r.id !== tmdbId);
			removingTmdbId = null;
		}, 500);
	}

	function handleMovieAdded() {
		refetchRecommendations();
	}

	onMount(() => {
		const addHandler = (e: Event) => handleAddToWatchlist(e as CustomEvent<{ tmdbId?: number }>);
		window.addEventListener('addToWatchlist', addHandler);
		window.addEventListener('movieAddedToWatchlist', handleMovieAdded);
		return () => {
			window.removeEventListener('addToWatchlist', addHandler);
			window.removeEventListener('movieAddedToWatchlist', handleMovieAdded);
		};
	});

	// Watchlist filters
	let statusFilter = $state<string>('all');
	let ratingFilter = $state<string>('all');
	let genreFilter = $state<string>('all');

	const allGenres = $derived(
		(data.genres ?? []).slice().sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
	);

	const filteredMovies = $derived.by(() => {
		const movies = data.movies ?? [];
		return movies.filter((movie) => {
			if (statusFilter !== 'all' && (movie.status ?? 'want_to_watch') !== statusFilter) {
				return false;
			}
			if (ratingFilter !== 'all') {
				if (ratingFilter === 'unrated') {
					if (movie.rating != null) return false;
				} else {
					const r = Number(ratingFilter);
					if (movie.rating !== r) return false;
				}
			}
			if (genreFilter !== 'all') {
				const genreIds = (movie.genreIds ?? []) as number[];
				if (!genreIds.includes(Number(genreFilter))) return false;
			}
			return true;
		});
	});

	$effect(() => {
		let cancelled = false;
		recommendationsLoading = true;
		fetch('/api/recommendations', { credentials: 'include' })
			.then((res) => (res.status === 401 ? [] : res.json()))
			.then((json) => {
				if (cancelled) return;
				recommendations = json?.recommendations ?? [];
				recommendationsLoading = false;
			})
			.catch(() => {
				if (!cancelled) {
					recommendations = [];
					recommendationsLoading = false;
				}
			});
		return () => {
			cancelled = true;
		};
	});
</script>

<div class="segmented-control">
	<button
		type="button"
		class:active={activeTab === 'recommendations'}
		onclick={() => (activeTab = 'recommendations')}
	>
		Recommendations
	</button>
	<button
		type="button"
		class:active={activeTab === 'watchlist'}
		onclick={() => (activeTab = 'watchlist')}
	>
		Watchlist
	</button>
</div>

{#if form && 'message' in form && form.message}
	<p class="error">{form.message}</p>
{/if}

{#if activeTab === 'recommendations'}
	{#if recommendationsLoading}
		<p class="empty-state">Loading recommendations...</p>
	{:else if !data.hasPreferences}
		<div class="empty-state">
			<p>Add your preferences to get personalized movie recommendations.</p>
			<a href="/profile">Set preferences</a>
		</div>
	{:else if recommendations.length === 0}
		<div class="empty-state">
			<p>No recommendations right now. Try adding more genres or favorite movies.</p>
			<a href="/profile">Set preferences</a>
		</div>
	{:else}
		<ul class="movie-grid">
			{#each recommendations as rec (rec.id)}
				<li class={removingTmdbId === rec.id ? 'movie-grid-item--adding' : ''}>
					<MovieCard
						title={rec.title}
						posterPath={rec.posterPath}
						genreNames={rec.genreNames ?? []}
						tmdbId={rec.id}
						genreIds={rec.genreIds ?? []}
					/>
				</li>
			{/each}
		</ul>
	{/if}
{:else}
	{#if data.movies.length === 0}
		<div class="empty-state">
			<p>Your watchlist is empty. Search for movies to add them.</p>
			<p>Use the search icon in the menu to find movies.</p>
		</div>
	{:else}
		<div class="watchlist-filters">
			<div class="filter-group">
				<label for="filter-status">Status</label>
				<select id="filter-status" bind:value={statusFilter} class="filter-select">
					<option value="all">All</option>
					<option value="want_to_watch">Want to watch</option>
					<option value="watching">Watching</option>
					<option value="watched">Watched</option>
				</select>
			</div>
			<div class="filter-group">
				<label for="filter-rating">Rating</label>
				<select id="filter-rating" bind:value={ratingFilter} class="filter-select">
					<option value="all">All</option>
					<option value="1">1★</option>
					<option value="2">2★</option>
					<option value="3">3★</option>
					<option value="4">4★</option>
					<option value="5">5★</option>
					<option value="unrated">Unrated</option>
				</select>
			</div>
			<div class="filter-group">
				<label for="filter-genre">Genre</label>
				<select id="filter-genre" bind:value={genreFilter} class="filter-select">
					<option value="all">All</option>
					{#each allGenres as genre}
						<option value={genre.id}>{genre.name}</option>
					{/each}
				</select>
			</div>
		</div>
		{#if filteredMovies.length === 0}
			<p class="empty-state">No movies match your filters.</p>
		{:else}
			<ul class="movie-grid">
				{#each filteredMovies as movie (movie.id)}
					<li>
						<WatchlistCard
							id={movie.id}
							title={movie.title}
							posterPath={movie.posterPath}
							status={movie.status ?? 'want_to_watch'}
							rating={movie.rating}
						/>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
{/if}
