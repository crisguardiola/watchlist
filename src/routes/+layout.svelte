<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/icons/Icon.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="header layout">
	<a href="/" class="header-brand">
		<Icon name="film" size={20} />
		Watchlist
	</a>
	{#if data.user}
		<div class="header-user">
			<span class="header-user-info">
				<Icon name="user" size={14} />
				{data.user.name || data.user.email}
			</span>
			<form method="post" action="/auth/signout" use:enhance class="header-user-form">
				<button type="submit" class="secondary btn-icon">
					<Icon name="log-out" size={14} />
					Log out
				</button>
			</form>
		</div>
	{/if}
</header>

<main class="layout">
	{@render children()}
</main>
