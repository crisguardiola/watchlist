<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/icons/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p';
	const posterSize = 'w780';

	let currentIndex = $state(0);
	const SLIDE_INTERVAL = 4500;
	const movies = $derived(data.movies ?? []);

	$effect(() => {
		if (movies.length <= 1) return;
		const id = setInterval(() => {
			currentIndex = (currentIndex + 1) % movies.length;
		}, SLIDE_INTERVAL);
		return () => clearInterval(id);
	});
</script>

<div class="login-split">
	<div class="login-hero">
		<div class="login-slider">
			{#each movies as movie, i}
				<div
					class="login-slide"
					class:active={i === currentIndex}
				>
					<img
						src="{TMDB_POSTER_BASE}/{posterSize}{movie.posterPath}"
						alt=""
						class="login-slide-poster"
					/>
					<div class="login-slide-overlay"></div>
					<p class="login-slide-title">{movie.title}</p>
				</div>
			{/each}
		</div>
	</div>

	<div class="login-form-column">
		<div class="login-form-inner">
			<a href="/" class="login-logo">
				<Icon name="vault" size={28} />
				CineVault
			</a>
			<h1>Login</h1>
			{#if data.loggedOut}
				<p class="logged-out-message">You've been logged out. Sign in again to continue.</p>
			{/if}
			<form method="post" action="?/signInEmail" use:enhance class="form-stack login-form-stack">
				<label>
					<span class="label-with-icon"><Icon name="mail" size={14} /> Email</span>
					<input type="email" name="email" placeholder="you@example.com" />
				</label>
				<label>
					<span class="label-with-icon"><Icon name="lock" size={14} /> Password</span>
					<input type="password" name="password" placeholder="••••••••" />
				</label>
				<label>
					<span class="label-with-icon"><Icon name="user" size={14} /> Name (for registration)</span>
					<input name="name" placeholder="Your name" />
				</label>
				<div class="form-actions">
					<button class="btn-icon">
						<Icon name="log-in" size={16} />
						Login
					</button>
					<button formaction="?/signUpEmail" class="btn-icon">
						<Icon name="user-plus" size={16} />
						Register
					</button>
				</div>
			</form>
			<p class="error">{form?.message ?? ''}</p>
		</div>
	</div>
</div>
