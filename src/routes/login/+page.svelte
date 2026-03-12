<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/icons/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
</script>

<h1>Login</h1>
{#if data.loggedOut}
	<p class="logged-out-message">You've been logged out. Sign in again to continue.</p>
{/if}
<form method="post" action="?/signInEmail" use:enhance class="form-stack">
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
