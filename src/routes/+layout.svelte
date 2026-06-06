<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import FeedbackButton from '$lib/components/FeedbackButton.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-gob focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
>
	Saltar al contenido principal
</a>

<main id="main" class="contents">
	{@render children()}
</main>

<FeedbackButton />
