<script lang="ts">
	import { enhance } from '$app/forms';
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
		<input type="text" name="title" />
	</label>
	<button>Add</button>
</form>

{#if form?.message}
	<p class="error">{form.message}</p>
{/if}

<ul class="movie-list">
	{#each data.movies as movie (movie.id)}
		<li>{movie.title}</li>
	{/each}
</ul>

<form method="post" action="?/signOut" use:enhance>
	<button type="submit" class="secondary">Sign out</button>
</form>
