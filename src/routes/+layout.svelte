<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import FeedbackButton from '$lib/components/FeedbackButton.svelte';

	let { data, children } = $props();
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

{#if data.loggedIn && data.usuario}
	<!-- Barra flotante de sesión: solo aparece si el usuario tiene cookie.
	     Posición fija para no chocar con SiteHeader; print:hidden para no
	     imprimirse. -->
	<div
		class="fixed top-2 right-2 z-40 flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-3 py-1.5 text-xs shadow-sm backdrop-blur print:hidden"
	>
		<span class="text-neutral-500">Sesión:</span>
		<span class="font-medium text-neutral-800">
			{data.usuario.nombre}
			{data.usuario.apellido_pat}
		</span>
		<form method="POST" action="/logout">
			<button
				type="submit"
				class="rounded-full px-2 py-0.5 text-gob transition hover:bg-rose-50 hover:text-rose-700"
			>
				Cerrar sesión
			</button>
		</form>
	</div>
{/if}

<main id="main" class="contents">
	{@render children()}
</main>

<FeedbackButton />
