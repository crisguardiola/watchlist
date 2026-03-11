<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/icons/Icon.svelte';
	import SearchPopover from '$lib/components/SearchPopover.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	let searchOpen = $state(false);
	let profileDropdownOpen = $state(false);
	let searchTriggerEl: HTMLButtonElement | undefined;
	let profileTriggerEl: HTMLButtonElement | undefined;

	function openSearch() {
		searchOpen = true;
	}

	function closeSearch() {
		searchOpen = false;
	}

	function getSearchTriggerRect(): DOMRect | null {
		return searchTriggerEl?.getBoundingClientRect() ?? null;
	}

	function toggleProfileDropdown() {
		profileDropdownOpen = !profileDropdownOpen;
	}

	function closeProfileDropdown() {
		profileDropdownOpen = false;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.profile-dropdown-wrapper')) {
			closeProfileDropdown();
		}
	}

	$effect(() => {
		if (profileDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
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
		<div class="header-actions">
			<button
				type="button"
				class="header-btn"
				aria-label="Search movies"
				data-search-trigger
				bind:this={searchTriggerEl}
				onclick={openSearch}
			>
				<Icon name="search" size={20} />
			</button>
			<div class="profile-dropdown-wrapper">
				<button
					type="button"
					class="profile-trigger"
					aria-expanded={profileDropdownOpen}
					aria-haspopup="true"
					bind:this={profileTriggerEl}
					onclick={toggleProfileDropdown}
				>
					<Icon name="user" size={14} />
					{data.user.name || data.user.email}
				</button>
				{#if profileDropdownOpen}
					<div class="profile-dropdown">
						<a href="/profile" onclick={closeProfileDropdown}>Set preferences</a>
						<form method="post" action="/auth/signout" use:enhance>
							<button type="submit" onclick={closeProfileDropdown}>
								<Icon name="log-out" size={14} />
								Log out
							</button>
						</form>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</header>

<SearchPopover
	open={searchOpen}
	onClose={closeSearch}
	triggerRect={searchOpen ? getSearchTriggerRect() : null}
/>

<main class="layout main-content">
	{@render children()}
</main>
