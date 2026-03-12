<script lang="ts">
	import Icon from '$lib/components/icons/Icon.svelte';

	interface Props {
		value?: string;
		onchange?: (value: string) => void;
		id?: string;
	}

	let { value = $bindable('all'), onchange, id = 'filter-status' }: Props = $props();

	const statusOptions = [
		{ value: 'all', label: 'All', icon: 'list' as const },
		{ value: 'want_to_watch', label: 'Want to watch', icon: 'bookmark' as const },
		{ value: 'watching', label: 'Watching', icon: 'play' as const },
		{ value: 'watched', label: 'Watched', icon: 'check' as const }
	];

	let dropdownOpen = $state(false);
	let wrapperRef: HTMLDivElement | undefined;

	$effect(() => {
		if (!dropdownOpen) return;
		const handler = (e: MouseEvent) => {
			if (wrapperRef && !wrapperRef.contains(e.target as Node)) {
				dropdownOpen = false;
			}
		};
		const timeoutId = setTimeout(() => document.addEventListener('click', handler), 0);
		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('click', handler);
		};
	});

	function selectOption(optionValue: string) {
		value = optionValue;
		onchange?.(optionValue);
		dropdownOpen = false;
	}
</script>

<div class="filter-status-select" bind:this={wrapperRef}>
	<button
		type="button"
		class="filter-status-trigger"
		id={id}
		aria-expanded={dropdownOpen}
		aria-haspopup="listbox"
		onclick={() => (dropdownOpen = !dropdownOpen)}
	>
		<Icon name={statusOptions.find((o) => o.value === value)?.icon ?? 'list'} size={14} />
		<span class="filter-status-trigger-label">{statusOptions.find((o) => o.value === value)?.label ?? 'All'}</span>
		<span class="filter-status-chevron" class:open={dropdownOpen}>
			<Icon name="chevron-down" size={12} />
		</span>
	</button>
	{#if dropdownOpen}
		<div class="filter-status-dropdown" role="listbox">
			{#each statusOptions as option}
				<button
					type="button"
					role="option"
					class="filter-status-option"
					class:selected={value === option.value}
					aria-selected={value === option.value}
					onclick={() => selectOption(option.value)}
				>
					<Icon name={option.icon} size={14} />
					<span>{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
