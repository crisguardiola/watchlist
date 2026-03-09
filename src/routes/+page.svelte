<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/icons/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1>Watchlist</h1>

<form
	method="post"
	action="?/addMovie"
	use:enhance={() => {
		return async ({ update }) => {
			await update();
		};
	}}
	class="form-stack"
>
	<label>
		Title
		<input type="text" name="title" placeholder="Add a movie..." />
	</label>
	<button class="btn-icon">
		<Icon name="plus" size={16} />
		Add
	</button>
</form>

{#if form?.message}
	<p class="error">{form.message}</p>
{/if}

<ul class="movie-list">
	{#each data.movies as movie (movie.id)}
		<li>
			<form method="post" action="?/deleteMovie" use:enhance class="movie-item">
				<input type="hidden" name="id" value={movie.id} />
				<span>{movie.title}</span>
				<button type="submit" class="delete-btn btn-icon">
					<Icon name="trash-2" size={14} />
					Delete
				</button>
			</form>
		</li>
	{/each}
</ul>
