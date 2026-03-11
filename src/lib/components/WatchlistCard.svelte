<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/icons/Icon.svelte';

	interface Props {
		id: number;
		title: string;
		posterPath: string | null;
		status: 'want_to_watch' | 'watching' | 'watched';
		rating: number | null;
	}

	let { id, title, posterPath, status, rating }: Props = $props();

	const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p';
	const posterSize = 'w342';

	const statusLabels: Record<string, string> = {
		want_to_watch: 'Want to watch',
		watching: 'Watching',
		watched: 'Watched'
	};
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
	<div class="movie-card-content watchlist-card-content">
		<h3 class="movie-card-title">{title}</h3>
		<div class="watchlist-card-meta">
			<form method="post" action="/?/updateStatus" use:enhance class="movie-status-form">
				<input type="hidden" name="id" value={id} />
				<select
					name="status"
					class="watchlist-card-status"
					value={status}
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
				>
					<option value="want_to_watch">Want to watch</option>
					<option value="watching">Watching</option>
					<option value="watched">Watched</option>
				</select>
			</form>
		</div>
		<div class="watchlist-card-actions">
			<form method="post" action="/?/updateRating" use:enhance class="star-rating-form">
				<input type="hidden" name="id" value={id} />
				<div class="star-rating" role="group" aria-label="Rate this movie">
					{#each [1, 2, 3, 4, 5] as star}
						<button
							type="submit"
							name="rating"
							value={star}
							class="star-btn"
							aria-label="Rate {star} star{star === 1 ? '' : 's'}"
							aria-pressed={rating === star}
						>
							<span class="star {rating !== null && star <= rating ? 'filled' : 'empty'}">
								{rating !== null && star <= rating ? '★' : '☆'}
							</span>
						</button>
					{/each}
					{#if rating !== null}
						<button
							type="submit"
							name="rating"
							value="0"
							class="star-clear"
							aria-label="Clear rating"
						>
							×
						</button>
					{/if}
				</div>
			</form>
			<form method="post" action="/?/deleteMovie" use:enhance>
				<input type="hidden" name="id" value={id} />
				<button type="submit" class="watchlist-card-delete" aria-label="Delete {title}">
					<Icon name="trash-2" size={14} />
				</button>
			</form>
		</div>
	</div>
</article>
