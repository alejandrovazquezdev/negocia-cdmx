<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { onMount, onDestroy } from 'svelte';
	import { buscarDenue } from '$lib/denue';
	import type { UnidadEconomica } from '$lib/denue';

	interface Props {
		cp?: string | null;
		calle?: string | null;
		colonia?: string | null;
		keyword?: string;
	}

	let { cp = null, calle = null, colonia = null, keyword = 'comercio' }: Props = $props();

	// Estado del formulario de dirección
	let formCp = $state(cp ?? '');
	let formCalle = $state(calle ?? '');
	let formColonia = $state(colonia ?? '');
	let guardando = $state(false);
	let errorForm = $state('');
	let tieneDir = $state(!!(cp && calle && colonia));

	// Estado del mapa y DENUE
	let cargando = $state(false);
	let errorMapa = $state('');
	let negocios = $state<UnidadEconomica[]>([]);
	let seleccionado = $state<UnidadEconomica | null>(null);

	// Referencias de Leaflet (tipado relajado para evitar import estático)
	let mapEl: HTMLDivElement;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let mapa: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let marcadores: any[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let marcadorCentro: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let L: any;

	onMount(async () => {
		L = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		delete L.Icon.Default.prototype._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
			iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
			shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
		});

		mapa = L.map(mapEl).setView([19.4326, -99.1332], 12);
		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(mapa);

		if (tieneDir && cp && calle && colonia) {
			await cargar(`${calle}, ${colonia}, ${cp}`);
		}
	});

	onDestroy(() => mapa?.remove());

	function limpiarMarcadores() {
		for (const m of marcadores) m.remove();
		marcadores = [];
		marcadorCentro?.remove();
		marcadorCentro = null;
	}

	async function cargar(dir: string) {
		cargando = true;
		errorMapa = '';
		seleccionado = null;
		limpiarMarcadores();

		try {
			const r = await buscarDenue({ direccion: dir, keyword, radio: 1000 });
			negocios = r.negocios ?? [];

			mapa.setView([r.lat, r.lng], 15);

			const iconoCentro = L.divIcon({
				html: `<div style="background:#a02142;border:3px solid white;border-radius:50%;width:16px;height:16px;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
				className: '',
				iconSize: [16, 16],
				iconAnchor: [8, 8]
			});
			marcadorCentro = L.marker([r.lat, r.lng], { icon: iconoCentro })
				.addTo(mapa)
				.bindTooltip('Tu negocio', { permanent: false });

			for (const n of negocios) {
				const lat = parseFloat(n.Latitud);
				const lng = parseFloat(n.Longitud);
				if (isNaN(lat) || isNaN(lng)) continue;
				const m = L.marker([lat, lng])
					.addTo(mapa)
					.on('click', () => {
						seleccionado = n;
					});
				marcadores.push(m);
			}
		} catch (e) {
			errorMapa = (e as Error).message;
		} finally {
			cargando = false;
		}
	}

	async function guardarDireccion() {
		errorForm = '';
		if (!formCp.trim() || !formCalle.trim() || !formColonia.trim()) {
			errorForm = 'Todos los campos son obligatorios.';
			return;
		}
		if (!/^\d{5}$/.test(formCp.trim())) {
			errorForm = 'El código postal debe tener 5 dígitos numéricos.';
			return;
		}

		guardando = true;
		try {
			const res = await fetch('/api/negocio/direccion', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					cp: formCp.trim(),
					calle: formCalle.trim(),
					colonia: formColonia.trim()
				})
			});
			if (!res.ok) throw new Error(await res.text());

			cp = formCp.trim();
			calle = formCalle.trim();
			colonia = formColonia.trim();
			tieneDir = true;
			await cargar(`${calle}, ${colonia}, ${cp}`);
		} catch (e) {
			errorForm = (e as Error).message;
		} finally {
			guardando = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	{#if !tieneDir}
		<!-- Formulario de dirección, mostrado encima del mapa -->
		<div class="rounded-xl border border-amber-200 bg-amber-50 p-4">
			<p class="mb-3 text-sm font-medium text-amber-900">
				Para mostrarte negocios aledaños necesitamos la dirección de tu empresa.
			</p>
			<div class="grid gap-3 sm:grid-cols-3">
				<div>
					<label for="dir-cp" class="mb-1 block text-xs font-medium text-neutral-700"
						>Código Postal</label
					>
					<input
						id="dir-cp"
						bind:value={formCp}
						type="text"
						inputmode="numeric"
						maxlength="5"
						placeholder="06600"
						class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gob focus:ring-2 focus:ring-gob/30"
					/>
				</div>
				<div>
					<label for="dir-calle" class="mb-1 block text-xs font-medium text-neutral-700"
						>Calle y número</label
					>
					<input
						id="dir-calle"
						bind:value={formCalle}
						type="text"
						placeholder="Av. Insurgentes Sur 123"
						class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gob focus:ring-2 focus:ring-gob/30"
					/>
				</div>
				<div>
					<label for="dir-colonia" class="mb-1 block text-xs font-medium text-neutral-700"
						>Colonia</label
					>
					<input
						id="dir-colonia"
						bind:value={formColonia}
						type="text"
						placeholder="Roma Norte"
						class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gob focus:ring-2 focus:ring-gob/30"
					/>
				</div>
			</div>
			{#if errorForm}
				<p class="mt-2 text-xs text-red-600">{errorForm}</p>
			{/if}
			<button
				onclick={guardarDireccion}
				disabled={guardando}
				class="mt-3 rounded-lg bg-gob px-5 py-2 text-sm font-medium text-white transition hover:bg-gob-dark disabled:opacity-50"
			>
				{guardando ? 'Guardando…' : 'Ver negocios aledaños'}
			</button>
		</div>
	{/if}

	{#if errorMapa}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
			{errorMapa}
		</p>
	{/if}

	{#if cargando}
		<p class="text-sm text-neutral-500">Consultando DENUE — buscando negocios aledaños…</p>
	{/if}

	<!-- Mapa -->
	<div bind:this={mapEl} class="h-80 w-full rounded-xl border border-neutral-200 shadow-sm"></div>

	{#if negocios.length > 0 && !cargando}
		<p class="text-xs text-neutral-500">
			{negocios.length} negocios encontrados en 1 km · haz clic en un marcador para ver el detalle
		</p>
	{:else if tieneDir && negocios.length === 0 && !cargando}
		<p class="text-sm text-neutral-500">
			Sin negocios registrados en DENUE a 1 km para "{keyword}".
		</p>
	{/if}

	<!-- Panel de detalle al hacer clic en un marcador -->
	{#if seleccionado}
		<div class="rounded-xl border border-neutral-200 bg-white p-4 text-sm shadow-sm">
			<div class="flex items-start justify-between gap-2">
				<div>
					<h3 class="font-semibold text-neutral-900">{seleccionado.Nombre || '—'}</h3>
					{#if seleccionado.Razon_social}
						<p class="mt-0.5 text-xs text-neutral-500">{seleccionado.Razon_social}</p>
					{/if}
				</div>
				<button
					onclick={() => {
						seleccionado = null;
					}}
					aria-label="Cerrar detalle"
					class="text-lg leading-none text-neutral-400 hover:text-neutral-600"
				>
					×
				</button>
			</div>

			<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
				<div class="col-span-2">
					<dt class="text-neutral-400">Clase de actividad</dt>
					<dd class="text-neutral-700">{seleccionado.Clase_actividad || '—'}</dd>
				</div>
				<div>
					<dt class="text-neutral-400">Latitud</dt>
					<dd class="font-mono text-neutral-700">{seleccionado.Latitud}</dd>
				</div>
				<div>
					<dt class="text-neutral-400">Longitud</dt>
					<dd class="font-mono text-neutral-700">{seleccionado.Longitud}</dd>
				</div>
				<div>
					<dt class="text-neutral-400">Teléfono</dt>
					<dd class="text-neutral-700">{seleccionado.Telefono || '—'}</dd>
				</div>
				<div>
					<dt class="text-neutral-400">Página web</dt>
					<dd class="text-neutral-700">
						{#if seleccionado.www}
							<a
								href={seleccionado.www.startsWith('http')
									? seleccionado.www
									: `https://${seleccionado.www}`}
								target="_blank"
								rel="noopener noreferrer"
								class="text-gob hover:underline"
							>
								{seleccionado.www}
							</a>
						{:else}
							—
						{/if}
					</dd>
				</div>
			</dl>
		</div>
	{/if}
</div>
