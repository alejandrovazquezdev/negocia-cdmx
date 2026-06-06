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
	<!-- Banda de sesión a todo lo ancho, encima del SiteHeader. No hay forma
	     de no verla. print:hidden para no imprimirse con el reporte. -->
	<div class="bg-gob text-white print:hidden" role="status" aria-label="Sesión activa">
		<div
			class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:flex-nowrap"
		>
			<div class="flex items-center gap-2">
				<!-- icono de persona -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="h-4 w-4"
					aria-hidden="true"
				>
					<circle cx="12" cy="8" r="4" />
					<path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
				</svg>
				<span class="font-semibold">Sesión activa:</span>
				<span>{data.usuario.nombre} {data.usuario.apellido_pat}</span>
			</div>
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="rounded-md bg-white px-3 py-1 text-sm font-semibold text-gob shadow-sm transition hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-white/70"
				>
					Cerrar sesión
				</button>
			</form>
		</div>
	</div>
{/if}

<main id="main" class="contents">
	{@render children()}
</main>

<FeedbackButton />
