<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/icons/Icon.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface TmdbResult {
		id: number;
		title: string;
		posterPath: string;
		mediaType: 'movie' | 'tv';
	}

	const genreIds = (data.preferences?.genreIds ?? []) as number[];
	const favoriteMoviesFromServer = data.favoriteMovies ?? [];

	let selectedGenreIds = $state<number[]>(genreIds);
	let selectedMovies = $state<TmdbResult[]>(favoriteMoviesFromServer);
	let searchQuery = $state('');
	let searchResults = $state<TmdbResult[]>([]);
	let searchLoading = $state(false);
	let showDropdown = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const genres = data.genres ?? [];

	function toggleGenre(id: number) {
		if (selectedGenreIds.includes(id)) {
			selectedGenreIds = selectedGenreIds.filter((g) => g !== id);
		} else {
			selectedGenreIds = [...selectedGenreIds, id];
		}
	}

	async function search() {
		const q = searchQuery.trim();
		if (q.length < 2) {
			searchResults = [];
			return;
		}
		searchLoading = true;
		try {
			const res = await fetch(`/api/search-tmdb?q=${encodeURIComponent(q)}`);
			const json = await res.json();
			const results = (json.results ?? []).filter((r: TmdbResult) => r.mediaType === 'movie');
			searchResults = results.filter(
				(r: TmdbResult) => !selectedMovies.some((m) => m.id === r.id)
			);
		} catch {
			searchResults = [];
		} finally {
			searchLoading = false;
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

	function addMovie(movie: TmdbResult) {
		if (selectedMovies.length >= 5) return;
		if (selectedMovies.some((m) => m.id === movie.id)) return;
		selectedMovies = [...selectedMovies, movie];
		searchResults = searchResults.filter((r) => r.id !== movie.id);
	}

	function removeMovie(id: number) {
		selectedMovies = selectedMovies.filter((m) => m.id !== id);
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

	const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p';
</script>

<h1>Profile</h1>

<section class="profile-user">
	<p class="profile-user-info">
		<Icon name="user" size={16} />
		{data.user?.name || data.user?.email}
	</p>
	{#if data.user?.email}
		<p class="profile-user-email">{data.user.email}</p>
	{/if}
</section>

<h2>Movie preferences</h2>
<p class="onboarding-hint">Update your preferences to get better recommendations.</p>

<form
	method="post"
	action="?/updatePreferences"
	use:enhance
	class="form-stack onboarding-form"
>
	<section class="onboarding-section">
		<h3>Favorite genres</h3>
		<div class="genre-grid">
			{#each genres as genre (genre.id)}
				<label class="genre-chip">
					<input
						type="checkbox"
						name="genreIds"
						value={genre.id}
						checked={selectedGenreIds.includes(genre.id)}
						onchange={() => toggleGenre(genre.id)}
					/>
					<span class="genre-chip-label">{genre.name}</span>
				</label>
			{/each}
		</div>
	</section>

	<section class="onboarding-section">
		<h3>Favorite movies</h3>
		<div class="search-wrapper">
			<input
				type="text"
				placeholder="Search movies..."
				value={searchQuery}
				oninput={onSearchInput}
				onfocus={() => (showDropdown = searchResults.length > 0 || searchLoading)}
				onblur={closeDropdown}
				autocomplete="off"
			/>
			{#if showDropdown}
				<div class="search-dropdown" role="group" aria-label="Search results" onmousedown={(e) => e.preventDefault()}>
					{#if searchLoading}
						<p class="search-loading">Searching...</p>
					{:else if searchResults.length === 0 && searchQuery.trim().length >= 2}
						<p class="search-empty">No movies found</p>
					{:else if searchResults.length > 0}
						{#each searchResults as result (result.id)}
							<button
								type="button"
								class="search-result"
								onmousedown={() => {
									cancelCloseDropdown();
									addMovie(result);
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
								</span>
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
		{#if selectedMovies.length > 0}
			<div class="selected-movies">
				{#each selectedMovies as movie (movie.id)}
					<div class="selected-movie">
						{#if movie.posterPath}
							<img
								src="{TMDB_POSTER_BASE}/w92{movie.posterPath}"
								alt=""
								width="46"
								height="69"
							/>
						{:else}
							<span class="search-result-placeholder">
								<Icon name="film" size={24} />
							</span>
						{/if}
						<span class="selected-movie-title">{movie.title}</span>
						<button
							type="button"
							class="remove-movie-btn"
							onclick={() => removeMovie(movie.id)}
							aria-label="Remove {movie.title}"
						>
							×
						</button>
					</div>
				{/each}
			</div>
			<p class="selected-count">{selectedMovies.length} of 5 selected</p>
		{/if}
	</section>

	{#each selectedMovies as movie}
		<input type="hidden" name="favoriteMovieIds" value={movie.id} />
	{/each}

	<div class="form-actions">
		<button type="submit" class="btn-icon">
			<Icon name="check" size={16} />
			Save preferences
		</button>
	</div>
</form>
