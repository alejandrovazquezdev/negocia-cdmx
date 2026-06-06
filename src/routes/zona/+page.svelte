<script lang="ts">
	import { resolve } from '$app/paths';
	import Brand from '$lib/components/Brand.svelte';
	import MapaNegocio from '$lib/components/MapaNegocio.svelte';
	import { GIROS } from '$lib/registro';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const giroLabel = $derived(GIROS.find((g) => g.value === data.negocio?.giro)?.label ?? '—');

	const keywordDenue = $derived(giroLabel !== '—' ? giroLabel : 'comercio');
</script>

<svelte:head>
	<title>Análisis de zona — NegociaCDMX</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<header class="border-b border-neutral-200 bg-white">
		<div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
			<Brand />
			<nav class="flex items-center gap-4 text-sm">
				<a href={resolve('/demo')} class="text-neutral-500 hover:text-gob">Mi negocio</a>
				<a href={resolve('/')} class="text-neutral-500 hover:text-gob">Inicio</a>
			</nav>
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-6 py-10">
		<div class="mb-6">
			<h1 class="text-xl font-bold text-neutral-900">Análisis de zona</h1>
			<p class="mt-1 text-sm text-neutral-500">
				Explora la competencia de <strong class="text-neutral-700"
					>{data.negocio?.nombre ?? 'tu negocio'}</strong
				>
				en cualquier colonia o código postal de la CDMX.
			</p>
		</div>

		<!-- Instrucciones rápidas -->
		<div class="mb-6 grid gap-3 sm:grid-cols-3">
			<div class="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
				<span class="mb-2 block text-lg font-bold text-gob">1</span>
				<p class="text-neutral-600">
					Escribe un <strong>código postal</strong> de 5 dígitos o una <strong>dirección</strong> en la
					CDMX.
				</p>
			</div>
			<div class="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
				<span class="mb-2 block text-lg font-bold text-gob">2</span>
				<p class="text-neutral-600">
					Presiona <strong>Buscar</strong> para consultar el DENUE (INEGI) con negocios del giro
					<em>{keywordDenue}</em>.
				</p>
			</div>
			<div class="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
				<span class="mb-2 block text-lg font-bold text-gob">3</span>
				<p class="text-neutral-600">
					Haz clic en cualquier <strong>marcador</strong> del mapa para ver nombre, tamaño y contacto.
				</p>
			</div>
		</div>

		<!-- Mapa principal -->
		<div class="rounded-xl border border-neutral-200 bg-white p-6">
			<MapaNegocio keyword={keywordDenue} />
		</div>

		<!-- Nota de fuente -->
		<p class="mt-4 text-xs text-neutral-400">
			Datos del <a
				href="https://www.inegi.org.mx/app/mapa/denue/"
				target="_blank"
				rel="noopener noreferrer"
				class="underline hover:text-gob">DENUE — INEGI</a
			>. Mapa base por
			<a
				href="https://www.openstreetmap.org/copyright"
				target="_blank"
				rel="noopener noreferrer"
				class="underline hover:text-gob">OpenStreetMap</a
			>.
		</p>
	</main>
</div>
