<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { CDMX_CENTRO, CDMX_ZOOM, type Competidor } from '$lib/competencia';

	let {
		competidores = [],
		centro = CDMX_CENTRO,
		zoom = CDMX_ZOOM
	}: {
		competidores?: Competidor[];
		centro?: [number, number];
		zoom?: number;
	} = $props();

	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map | null = $state(null);
	let mapboxglRef: typeof import('mapbox-gl') | null = $state(null);
	let initError: string | null = $state(null);
	let markers: mapboxgl.Marker[] = [];

	function crearMarkerEl(): HTMLElement {
		const el = document.createElement('div');
		el.style.cssText =
			'width:16px;height:16px;border-radius:50%;background:#a02142;border:2px solid #fff;' +
			'box-shadow:0 0 0 3px rgba(160,33,66,0.25),0 1px 4px rgba(0,0,0,0.3);cursor:pointer;' +
			'transition:transform 160ms ease;';
		el.onmouseenter = () => (el.style.transform = 'scale(1.25)');
		el.onmouseleave = () => (el.style.transform = 'scale(1)');
		return el;
	}

	function popupHtml(c: Competidor): string {
		const dist = c.distanciaKm != null ? `${c.distanciaKm} km` : '';
		const calif = c.calificacion != null ? `★ ${c.calificacion}` : '';
		const meta = [c.ramo, dist, calif].filter(Boolean).join(' · ');
		return (
			`<div style="font-family:system-ui;font-size:13px;line-height:1.35">` +
			`<strong>${c.nombre}</strong><br>` +
			`<span style="color:#6b7280">${meta}</span></div>`
		);
	}

	function renderMarkers(mbMap: mapboxgl.Map, mapboxgl: typeof import('mapbox-gl')) {
		for (const m of markers) m.remove();
		markers = [];
		for (const c of competidores) {
			const popup = new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(popupHtml(c));
			const marker = new mapboxgl.Marker({ element: crearMarkerEl() })
				.setLngLat([c.lon, c.lat])
				.setPopup(popup)
				.addTo(mbMap);
			markers.push(marker);
		}
	}

	onMount(() => {
		let mbMap: mapboxgl.Map | null = null;

		(async () => {
			try {
				const { default: mapboxgl } = await import('mapbox-gl');
				mapboxglRef = mapboxgl;

				if (!PUBLIC_MAPBOX_TOKEN) {
					initError = 'PUBLIC_MAPBOX_TOKEN no está configurado en .env';
					return;
				}

				mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;
				mbMap = new mapboxgl.Map({
					container: mapContainer,
					style: 'mapbox://styles/mapbox/light-v11',
					center: centro,
					zoom
				});
				map = mbMap;

				mbMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
				mbMap.on('load', () => mbMap?.resize());

				renderMarkers(mbMap, mapboxgl);
			} catch (err) {
				initError = `Error al iniciar el mapa: ${err}`;
			}
		})();

		return () => {
			for (const m of markers) m.remove();
			mbMap?.remove();
		};
	});

	// Re-renderiza marcadores cuando cambia la lista (p. ej. al integrar datos reales).
	$effect(() => {
		void competidores;
		if (map && mapboxglRef) renderMarkers(map, mapboxglRef);
	});
</script>

<div class="relative h-full w-full">
	<div bind:this={mapContainer} class="h-full w-full"></div>
	{#if initError}
		<div
			class="absolute inset-0 flex items-center justify-center bg-neutral-50 p-6 text-center text-sm text-gob"
		>
			{initError}
		</div>
	{/if}
</div>
