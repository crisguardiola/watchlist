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

	const statusOptions = [
		{ value: 'want_to_watch', label: 'Want to watch', icon: 'bookmark' as const },
		{ value: 'watching', label: 'Watching', icon: 'play' as const },
		{ value: 'watched', label: 'Watched', icon: 'check' as const }
	];

	let statusDropdownOpen = $state(false);
	let statusWrapperRef: HTMLDivElement | undefined;

	$effect(() => {
		if (!statusDropdownOpen) return;
		const handler = (e: MouseEvent) => {
			if (statusWrapperRef && !statusWrapperRef.contains(e.target as Node)) {
				statusDropdownOpen = false;
			}
		};
		const id = setTimeout(() => document.addEventListener('click', handler), 0);
		return () => {
			clearTimeout(id);
			document.removeEventListener('click', handler);
		};
	});

	function selectStatus(value: string, e: MouseEvent) {
		const form = (e.currentTarget as HTMLElement).closest('form');
		if (form) {
			const input = form.querySelector<HTMLInputElement>('input[name="status"]');
			if (input) {
				input.value = value;
				form.requestSubmit();
			}
		}
		statusDropdownOpen = false;
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
	<div class="watchlist-card-remove">
		<form method="post" action="/?/deleteMovie" use:enhance>
			<input type="hidden" name="id" value={id} />
			<button type="submit" class="watchlist-card-remove-btn" aria-label="Remove {title} from watchlist">
				×
			</button>
		</form>
	</div>
	<div class="watchlist-card-rating-top">
		<form method="post" action="/?/updateRating" use:enhance class="star-rating-form">
			<input type="hidden" name="id" value={id} />
			<input type="hidden" name="rating" value="" />
			<div class="star-rating" role="group" aria-label="Rate this movie">
				{#each [1, 2, 3, 4, 5] as star}
					<button
						type="button"
						class="star-btn"
						aria-label="Rate {star} star{star === 1 ? '' : 's'}"
						aria-pressed={rating === star}
						onclick={(e) => {
							const form = (e.currentTarget as HTMLButtonElement).closest('form');
							const ratingInput = form?.querySelector<HTMLInputElement>('input[name="rating"]');
							if (form && ratingInput) {
								ratingInput.value = rating === star ? '0' : String(star);
								form.requestSubmit();
							}
						}}
					>
						<span class="star {rating !== null && star <= rating ? 'filled' : 'empty'}">
							{rating !== null && star <= rating ? '★' : '☆'}
						</span>
					</button>
				{/each}
			</div>
		</form>
	</div>
	<div class="movie-card-content watchlist-card-content">
		<h3 class="movie-card-title">{title}</h3>
		<div class="watchlist-card-meta">
			<form method="post" action="/?/updateStatus" use:enhance class="movie-status-form watchlist-status-form">
				<input type="hidden" name="id" value={id} />
				<input type="hidden" name="status" value={status} />
				<div class="watchlist-status-trigger-wrapper" bind:this={statusWrapperRef}>
					<button
						type="button"
						class="watchlist-status-trigger"
						onclick={() => (statusDropdownOpen = !statusDropdownOpen)}
						aria-expanded={statusDropdownOpen}
						aria-haspopup="listbox"
					>
						<Icon name={statusOptions.find((o) => o.value === status)?.icon ?? 'bookmark'} size={14} />
						<span class="watchlist-status-trigger-label">{statusOptions.find((o) => o.value === status)?.label ?? 'Want to watch'}</span>
						<span class="watchlist-status-chevron" class:open={statusDropdownOpen}>
							<Icon name="chevron-down" size={12} />
						</span>
					</button>
					{#if statusDropdownOpen}
						<div class="watchlist-status-dropdown" role="listbox">
							{#each statusOptions as option}
								<button
									type="button"
									role="option"
									class="watchlist-status-option"
									class:selected={status === option.value}
									aria-selected={status === option.value}
									onclick={(e) => selectStatus(option.value, e)}
								>
									<Icon name={option.icon} size={14} />
									<span>{option.label}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</form>
		</div>
	</div>
</article>
