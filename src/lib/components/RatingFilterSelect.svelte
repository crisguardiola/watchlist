<script lang="ts">
	import Icon from '$lib/components/icons/Icon.svelte';

	interface Props {
		value?: string;
		onchange?: (value: string) => void;
		id?: string;
	}

	let { value = $bindable('all'), onchange, id = 'filter-rating' }: Props = $props();

	const ratingOptions = [
		{ value: 'all', label: 'All', icon: 'list' as const },
		{ value: '1', label: '1★', icon: 'star' as const },
		{ value: '2', label: '2★', icon: 'star' as const },
		{ value: '3', label: '3★', icon: 'star' as const },
		{ value: '4', label: '4★', icon: 'star' as const },
		{ value: '5', label: '5★', icon: 'star' as const },
		{ value: 'unrated', label: 'Unrated', icon: 'star-off' as const }
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

<div class="filter-rating-select" bind:this={wrapperRef}>
	<button
		type="button"
		class="filter-rating-trigger"
		id={id}
		aria-expanded={dropdownOpen}
		aria-haspopup="listbox"
		onclick={() => (dropdownOpen = !dropdownOpen)}
	>
		<Icon name={ratingOptions.find((o) => o.value === value)?.icon ?? 'list'} size={14} />
		<span class="filter-rating-trigger-label">{ratingOptions.find((o) => o.value === value)?.label ?? 'All'}</span>
		<span class="filter-rating-chevron" class:open={dropdownOpen}>
			<Icon name="chevron-down" size={12} />
		</span>
	</button>
	{#if dropdownOpen}
		<div class="filter-rating-dropdown" role="listbox">
			{#each ratingOptions as option}
				<button
					type="button"
					role="option"
					class="filter-rating-option"
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
