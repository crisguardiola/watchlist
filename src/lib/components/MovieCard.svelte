<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/icons/Icon.svelte';

	interface Props {
		title: string;
		posterPath: string | null;
		genreNames?: string[];
	}

	let { title, posterPath, genreNames = [] }: Props = $props();

	const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p';
	const posterSize = 'w342';
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
	<div class="movie-card-content">
		<h3 class="movie-card-title">{title}</h3>
		{#if genreNames.length > 0}
			<p class="movie-card-category">{genreNames.slice(0, 2).join(', ')}</p>
		{/if}
		<form method="post" action="/?/addMovie" use:enhance class="movie-card-add-form">
			<input type="hidden" name="title" value={title} />
			<input type="hidden" name="poster_path" value={posterPath ?? ''} />
			<input type="hidden" name="status" value="want_to_watch" />
			<button type="submit" class="secondary btn-icon movie-card-add-btn">
				<Icon name="plus" size={14} />
				Add to Watchlist
			</button>
		</form>
	</div>
</article>
