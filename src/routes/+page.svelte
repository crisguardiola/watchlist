<script lang="ts">
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
	}

	type Tab = 'recommendations' | 'watchlist';
	let activeTab = $state<Tab>('recommendations');

	let recommendations = $state<Recommendation[]>([]);
	let recommendationsLoading = $state(true);

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
				<li>
					<MovieCard
						title={rec.title}
						posterPath={rec.posterPath}
						genreNames={rec.genreNames ?? []}
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
		<ul class="movie-grid">
			{#each data.movies as movie (movie.id)}
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
