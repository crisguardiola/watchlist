<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Icon from '$lib/components/icons/Icon.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		triggerRect?: DOMRect | null;
	}

	let { open, onClose, triggerRect }: Props = $props();

	const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p';

	interface TmdbResult {
		id: number;
		title: string;
		posterPath: string;
		mediaType: 'movie' | 'tv';
	}

	let searchQuery = $state('');
	let results = $state<TmdbResult[]>([]);
	let loading = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let addForm: HTMLFormElement | undefined;
	let inputEl: HTMLInputElement | undefined;

	async function doSearch() {
		const q = searchQuery.trim();
		if (q.length < 2) {
			results = [];
			return;
		}
		loading = true;
		try {
			const res = await fetch(`/api/search-tmdb?q=${encodeURIComponent(q)}`);
			const data = await res.json();
			results = data.results ?? [];
		} catch {
			results = [];
		} finally {
			loading = false;
		}
	}

	function onSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			doSearch();
			debounceTimer = null;
		}, 300);
	}

	function selectResult(result: TmdbResult) {
		const titleInput = addForm?.querySelector<HTMLInputElement>('input[name="title"]');
		const posterInput = addForm?.querySelector<HTMLInputElement>('input[name="poster_path"]');
		const tmdbIdInput = addForm?.querySelector<HTMLInputElement>('input[name="tmdb_id"]');
		const mediaTypeInput = addForm?.querySelector<HTMLInputElement>('input[name="media_type"]');
		if (titleInput) titleInput.value = result.title;
		if (posterInput) posterInput.value = result.posterPath;
		if (tmdbIdInput) tmdbIdInput.value = String(result.id);
		if (mediaTypeInput) mediaTypeInput.value = result.mediaType;
		searchQuery = '';
		results = [];
		addForm?.requestSubmit();
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.search-popover') && !target.closest('[data-search-trigger]')) {
			onClose();
		}
	}

	$effect(() => {
		if (open) {
			searchQuery = '';
			results = [];
			inputEl?.focus();
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

{#if open}
	<div
		class="search-popover"
		role="dialog"
		aria-label="Search movies"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		style={
			triggerRect
				? `top: ${triggerRect.bottom + 8}px; left: ${triggerRect.left}px;`
				: 'top: 4rem; left: 50%; transform: translateX(-50%);'
		}
	>
		<form
			bind:this={addForm}
			method="post"
			action="/?/addMovie"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					await invalidateAll();
					onClose();
				};
			}}
		>
			<input type="hidden" name="title" value="" />
			<input type="hidden" name="poster_path" value="" />
			<input type="hidden" name="tmdb_id" value="" />
			<input type="hidden" name="media_type" value="" />
			<input type="hidden" name="status" value="want_to_watch" />
			<input
				bind:this={inputEl}
				type="text"
				class="search-popover-input"
				placeholder="Search movies & TV..."
				value={searchQuery}
				oninput={onSearchInput}
				onkeydown={(e) => {
					if (e.key === 'Escape') onClose();
					if (e.key === 'Enter' && results.length > 0) {
						e.preventDefault();
						selectResult(results[0]);
					}
				}}
				autocomplete="off"
			/>
			<div class="search-popover-results">
				{#if loading}
					<p class="search-loading">Searching...</p>
				{:else if results.length === 0 && searchQuery.trim().length >= 2}
					<p class="search-empty">No results found</p>
				{:else if results.length > 0}
					{#each results as result (result.id)}
						<button
							type="button"
							class="search-result"
							onmousedown={(e) => {
								e.preventDefault();
								selectResult(result);
							}}
						>
							{#if result.posterPath}
								<img
									src="{TMDB_POSTER_BASE}/w92{result.posterPath}"
									alt=""
									width="46"
									height="69"
								/>
							{:else}
								<span class="search-result-placeholder">
									<Icon name="film" size={24} />
								</span>
							{/if}
							<span class="search-result-info">
								<span class="search-result-title">{result.title}</span>
								<span class="search-result-type">{result.mediaType === 'movie' ? 'Movie' : 'TV'}</span>
							</span>
						</button>
					{/each}
				{/if}
			</div>
		</form>
	</div>
{/if}
