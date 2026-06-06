<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { buscarDenue } from '$lib/denue';
	import type { UnidadEconomica } from '$lib/denue';

	interface Props {
		/** Palabra clave del giro a buscar (ej. "taquería", "ferretería"). */
		keyword?: string;
	}

	let { keyword = 'comercio' }: Props = $props();

	// Estado
	let consulta = $state('');
	let cargando = $state(false);
	let errorMsg = $state('');
	let negocios = $state<UnidadEconomica[]>([]);
	let centroLat = $state<number | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let centroLng = $state<number | null>(null);
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
		// Importación dinámica para evitar SSR (Leaflet requiere window/document).
		L = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		// Corregir rutas de íconos que Vite reubica.
		delete L.Icon.Default.prototype._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
			iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
			shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
		});

		// Centro inicial: CDMX
		mapa = L.map(mapEl).setView([19.4326, -99.1332], 12);
		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(mapa);
	});

	onDestroy(() => {
		mapa?.remove();
	});

	function limpiarMarcadores() {
		for (const m of marcadores) m.remove();
		marcadores = [];
		marcadorCentro?.remove();
		marcadorCentro = null;
	}

	async function buscar() {
		if (!consulta.trim()) return;
		cargando = true;
		errorMsg = '';
		seleccionado = null;
		limpiarMarcadores();

		try {
			// Detectar si es CP (5 dígitos) o dirección libre.
			const esCp = /^\d{5}$/.test(consulta.trim());
			const params = esCp
				? { cp: consulta.trim(), keyword, radio: 1000 }
				: { direccion: consulta.trim(), keyword, radio: 1000 };

			const resultado = await buscarDenue(params);
			centroLat = resultado.lat;
			centroLng = resultado.lng;
			negocios = resultado.negocios ?? [];

			// Mover el mapa al centro geocodificado.
			mapa.setView([resultado.lat, resultado.lng], 15);

			// Marcador de la zona consultada.
			const iconoCentro = L.divIcon({
				html: `<div style="background:#a02142;border:3px solid white;border-radius:50%;width:16px;height:16px;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
				className: '',
				iconSize: [16, 16],
				iconAnchor: [8, 8]
			});
			marcadorCentro = L.marker([resultado.lat, resultado.lng], { icon: iconoCentro })
				.addTo(mapa)
				.bindTooltip('Zona consultada', { permanent: false });

			// Marcadores de negocios.
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
			errorMsg = (e as Error).message;
		} finally {
			cargando = false;
		}
	}

	function formatearEstrato(estrato: string): string {
		const tabla: Record<string, string> = {
			'0 a 5 personas': 'Micro (0-5)',
			'6 a 10 personas': 'Pequeña (6-10)',
			'11 a 30 personas': 'Pequeña (11-30)',
			'31 a 50 personas': 'Mediana (31-50)',
			'51 a 100 personas': 'Mediana (51-100)',
			'101 a 250 personas': 'Grande (101-250)',
			'251 y más personas': 'Grande (251+)'
		};
		return tabla[estrato] ?? estrato;
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Buscador -->
	<div class="flex gap-2">
		<input
			bind:value={consulta}
			type="text"
			placeholder="Escribe un CP (ej. 06600) o dirección (ej. Av. Insurgentes 123)"
			class="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-gob focus:ring-2 focus:ring-gob/30"
			onkeydown={(e) => e.key === 'Enter' && buscar()}
		/>
		<button
			onclick={buscar}
			disabled={cargando || !consulta.trim()}
			class="rounded-lg bg-gob px-4 py-2 text-sm font-medium text-white transition hover:bg-gob-dark disabled:opacity-50"
		>
			{cargando ? 'Buscando…' : 'Buscar'}
		</button>
	</div>

	{#if errorMsg}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
			{errorMsg}
		</p>
	{/if}

	<!-- Mapa -->
	<div bind:this={mapEl} class="h-80 w-full rounded-xl border border-neutral-200 shadow-sm"></div>

	<!-- Panel de resultados -->
	{#if negocios.length > 0}
		<p class="text-xs text-neutral-500">
			{negocios.length} negocios encontrados · haz clic en un marcador para ver el detalle
		</p>
	{/if}

	{#if seleccionado}
		<div class="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
			<h3 class="font-semibold text-neutral-900">{seleccionado.Nombre}</h3>
			{#if seleccionado.Razon_social}
				<p class="text-xs text-neutral-500">{seleccionado.Razon_social}</p>
			{/if}

			<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
				<div>
					<dt class="text-neutral-400">Actividad</dt>
					<dd class="text-neutral-700">{seleccionado.Clase_actividad || '—'}</dd>
				</div>
				<div>
					<dt class="text-neutral-400">Tamaño</dt>
					<dd class="text-neutral-700">{formatearEstrato(seleccionado.Estrato)}</dd>
				</div>
				<div class="col-span-2">
					<dt class="text-neutral-400">Dirección</dt>
					<dd class="text-neutral-700">
						{[
							seleccionado.Tipo_vialidad,
							seleccionado.Calle,
							seleccionado.Num_Exterior,
							seleccionado.Num_Interior ? `Int. ${seleccionado.Num_Interior}` : '',
							seleccionado.Colonia,
							`CP ${seleccionado.CP}`
						]
							.filter(Boolean)
							.join(' ')}
					</dd>
				</div>
				{#if seleccionado.Telefono}
					<div>
						<dt class="text-neutral-400">Teléfono</dt>
						<dd class="text-neutral-700">{seleccionado.Telefono}</dd>
					</div>
				{/if}
				{#if seleccionado.Correo_e}
					<div>
						<dt class="text-neutral-400">Correo</dt>
						<dd class="truncate text-neutral-700">{seleccionado.Correo_e}</dd>
					</div>
				{/if}
			</dl>
		</div>
	{/if}

	{#if negocios.length === 0 && centroLat !== null && !cargando}
		<p class="text-sm text-neutral-500">Sin negocios registrados en esa zona para "{keyword}".</p>
	{/if}
</div>
