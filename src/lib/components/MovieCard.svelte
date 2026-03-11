<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Icon from '$lib/components/icons/Icon.svelte';
	import { playAddSound } from '$lib/sounds';

	interface Props {
		title: string;
		posterPath: string | null;
		genreNames?: string[];
		tmdbId?: number;
		genreIds?: number[];
	}

	let { title, posterPath, genreNames = [], tmdbId, genreIds = [] }: Props = $props();

	const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p';
	const posterSize = 'w342';

	function handleAddToWatchlist({ formData, action, cancel }: { formData: FormData; action: URL | null; cancel: () => void }) {
		cancel();
		playAddSound();
		const id = formData.get('tmdb_id') ? Number(formData.get('tmdb_id')) : undefined;
		window.dispatchEvent(new CustomEvent('addToWatchlist', { detail: { tmdbId: id } }));
		const url = action ? (typeof action === 'string' ? action : action.toString()) : window.location.pathname + '?/addMovie';
		fetch(url, {
			method: 'POST',
			body: formData,
			credentials: 'include'
		}).then(() => {
			invalidateAll();
			window.dispatchEvent(new CustomEvent('movieAddedToWatchlist'));
		});
	}
</script>

<article class="movie-card">
	{#if posterPath}
		<img
			src="{TMDB_POSTER_BASE}/{posterSize}{posterPath}"
			alt=""
			class="movie-card-poster"
		/>
	{:else}
		<span class="movie-card-poster movie-poster-placeholder" style="display: flex; align-items: center; justify-content: center;">
			<Icon name="film" size={48} />
		</span>
	{/if}
	<div class="movie-card-overlay" aria-hidden="true"></div>
	{#if genreNames.length > 0}
		<div class="movie-card-genre-tags">
			{#each genreNames.slice(0, 2) as genreName}
				<span class="movie-card-genre-tag">{genreName}</span>
			{/each}
		</div>
	{/if}
	<div class="movie-card-content">
		<h3 class="movie-card-title">{title}</h3>
		<form method="post" action="/?/addMovie" use:enhance={handleAddToWatchlist} class="movie-card-add-form">
			<input type="hidden" name="title" value={title} />
			<input type="hidden" name="poster_path" value={posterPath ?? ''} />
			{#if tmdbId}
				<input type="hidden" name="tmdb_id" value={tmdbId} />
				<input type="hidden" name="media_type" value="movie" />
			{/if}
			{#each genreIds as genreId}
				<input type="hidden" name="genreIds" value={genreId} />
			{/each}
			<input type="hidden" name="status" value="want_to_watch" />
			<button type="submit" class="secondary btn-icon movie-card-add-btn">
				<Icon name="plus" size={14} />
				Add to Watchlist
			</button>
		</form>
	</div>
</article>
