<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/icons/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

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
	let showDropdown = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let addForm: HTMLFormElement | undefined;

	async function search() {
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
			search();
			debounceTimer = null;
		}, 300);
		showDropdown = true;
	}

	function selectResult(result: TmdbResult) {
		const titleInput = addForm?.querySelector<HTMLInputElement>('input[name="title"]');
		const posterInput = addForm?.querySelector<HTMLInputElement>('input[name="poster_path"]');
		if (titleInput) titleInput.value = result.title;
		if (posterInput) posterInput.value = result.posterPath;
		searchQuery = '';
		results = [];
		showDropdown = false;
		addForm?.requestSubmit();
	}

	let blurTimeout: ReturnType<typeof setTimeout> | null = null;
	function closeDropdown() {
		blurTimeout = setTimeout(() => {
			showDropdown = false;
			blurTimeout = null;
		}, 150);
	}
	function cancelCloseDropdown() {
		if (blurTimeout) {
			clearTimeout(blurTimeout);
			blurTimeout = null;
		}
	}
</script>

<h1>Watchlist</h1>

<form
	bind:this={addForm}
	method="post"
	action="?/addMovie"
	use:enhance={() => {
		return async ({ update }) => {
			await update();
		};
	}}
	class="form-stack"
>
	<div class="search-wrapper">
		<label>
			Search movies & TV
			<input
				type="text"
				placeholder="Search to add..."
				value={searchQuery}
				oninput={onSearchInput}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						if (results.length > 0) selectResult(results[0]);
					}
				}}
				onfocus={() => (showDropdown = results.length > 0 || loading)}
				onblur={closeDropdown}
				autocomplete="off"
			/>
		</label>
		<input type="hidden" name="title" value="" />
		<input type="hidden" name="poster_path" value="" />
		{#if showDropdown}
			<div class="search-dropdown">
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
								cancelCloseDropdown();
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
		{/if}
	</div>
</form>

{#if form && 'message' in form && form.message}
	<p class="error">{form.message}</p>
{/if}

<ul class="movie-list">
	{#each data.movies as movie (movie.id)}
		<li>
			<form method="post" action="?/deleteMovie" use:enhance class="movie-item">
				<input type="hidden" name="id" value={movie.id} />
				{#if movie.posterPath}
					<img
						src="{TMDB_POSTER_BASE}/w185{movie.posterPath}"
						alt=""
						class="movie-poster"
						width="62"
						height="93"
					/>
				{:else}
					<span class="movie-poster-placeholder">
						<Icon name="film" size={32} />
					</span>
				{/if}
				<span class="movie-title">{movie.title}</span>
				<button type="submit" class="delete-btn btn-icon">
					<Icon name="trash-2" size={14} />
					Delete
				</button>
			</form>
		</li>
	{/each}
</ul>
