<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Icon from '$lib/components/icons/Icon.svelte';
	import SearchPopover from '$lib/components/SearchPopover.svelte';
	import PreferencesPopover from '$lib/components/PreferencesPopover.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	let searchOpen = $state(false);
	let preferencesOpen = $state(false);
	let profileDropdownOpen = $state(false);
	let profileTriggerEl: HTMLButtonElement | undefined;

	function openSearch() {
		searchOpen = true;
	}

	function closeSearch() {
		searchOpen = false;
	}

	function openPreferences() {
		preferencesOpen = true;
		profileDropdownOpen = false;
	}

	function closePreferences() {
		preferencesOpen = false;
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

	$effect(() => {
		const handler = () => (preferencesOpen = true);
		window.addEventListener('openPreferences', handler);
		return () => window.removeEventListener('openPreferences', handler);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="header layout">
	<a href="/" class="header-brand">
		<Icon name="vault" size={20} />
		CineVault
	</a>
	{#if data.user}
		<div class="header-actions">
			<button
				type="button"
				class="header-btn"
				aria-label="Search movies"
				data-search-trigger
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
						<button type="button" onclick={openPreferences}>Set preferences</button>
						<form method="post" action="/auth/signout">
							<button type="submit">
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
/>

<PreferencesPopover
	open={preferencesOpen}
	onClose={closePreferences}
/>

<main class="layout main-content">
	{@render children()}
</main>
