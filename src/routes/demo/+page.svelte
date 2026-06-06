<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import MapaDenue from '$lib/components/MapaDenue.svelte';
	import Semaforo from '$lib/components/Semaforo.svelte';
	import ReporteCard from '$lib/components/ReporteCard.svelte';
	import RadarCarga from '$lib/components/RadarCarga.svelte';
	import FlujoPeatonal from '$lib/components/FlujoPeatonal.svelte';
	import RutaAccion from '$lib/components/RutaAccion.svelte';
	import { GIROS } from '$lib/registro';
	import type { AnalisisResultado, EstablecimientoDenue } from '$lib/viabilidad/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function esNegocioValido(v: unknown): v is {
		nombre: string;
		giro: string;
		ramo: string | null;
		tiene_razon_social: number;
		razon_social: string | null;
		rfc: string | null;
		cp: string | null;
		calle: string | null;
		colonia: string | null;
	} {
		if (!v || typeof v !== 'object') return false;
		const n = v as Record<string, unknown>;
		return (
			typeof n.nombre === 'string' &&
			typeof n.giro === 'string' &&
			(n.tiene_razon_social === 0 || n.tiene_razon_social === 1)
		);
	}

	const giroLabel = $derived(GIROS.find((g) => g.value === data.negocio?.giro)?.label ?? '—');
	const giroValue = $derived(
		typeof data.negocio?.giro === 'string' ? data.negocio.giro : 'servicios'
	);

	// Palabra clave para DENUE: ramo específico o giro genérico como fallback.
	const keyword = $derived(
		esNegocioValido(data.negocio)
			? (data.negocio.ramo?.toLowerCase() ?? data.negocio.giro ?? 'comercio')
			: 'comercio'
	);

	// Zona para el análisis de IA: colonia + alcaldía inferida del CP.
	const zonaAnalisis = $derived(() => {
		if (!esNegocioValido(data.negocio)) return 'CDMX';
		const colonia = data.negocio.colonia ?? '';
		const cp = data.negocio.cp ?? '';
		return [colonia, cp ? `CP ${cp}` : ''].filter(Boolean).join(', ') || 'CDMX';
	});

	// --- Estado del análisis de viabilidad (IA) ---
	type Estado = 'idle' | 'loading' | 'done' | 'error';
	type NivelFlujo = 'bajo' | 'medio' | 'alto';
	let estado = $state<Estado>('idle');
	let etapaActual = $state(0);
	let resultado = $state<AnalisisResultado | null>(null);
	let errorMsg = $state<string | null>(null);

	const etapasFiltro = [
		'Validando identidad del dueño',
		'Verificando dirección con CP',
		'Cruzando con DENUE de la zona',
		'Calculando semáforo de viabilidad',
		'Generando reporte con IA'
	];

	let timerEtapa: ReturnType<typeof setInterval> | null = null;
	let abortController: AbortController | null = null;

	function arrancarEtapas() {
		etapaActual = 0;
		timerEtapa = setInterval(() => {
			if (etapaActual < etapasFiltro.length - 1) {
				etapaActual++;
			}
		}, 900);
	}

	function detenerEtapas() {
		if (timerEtapa) {
			clearInterval(timerEtapa);
			timerEtapa = null;
		}
	}

	async function generarAnalisis() {
		if (!data.negocio) return;

		estado = 'loading';
		errorMsg = null;
		resultado = null;
		arrancarEtapas();
		abortController = new AbortController();

		try {
			const res = await fetch('/api/viabilidad', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					negocio: {
						nombre: data.negocio.nombre,
						giro: giroValue,
						ramo: data.negocio.ramo ?? 'Sin ramo',
						zona: zonaAnalisis()
					}
				}),
				signal: abortController.signal
			});

			if (!res.ok) {
				const errBody = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(errBody.error ?? `Error ${res.status}`);
			}

			const json = (await res.json()) as AnalisisResultado;
			// Marcar todas las etapas como completas antes de pasar a 'done'.
			etapaActual = etapasFiltro.length;
			resultado = json;
			estado = 'done';
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			errorMsg = err instanceof Error ? err.message : 'Error de red';
			estado = 'error';
		} finally {
			detenerEtapas();
		}
	}

	function reintentar() {
		void generarAnalisis();
	}

	// Auto-arranca al cargar la página si hay registro válido.
	let yaArranco = false;
	onMount(() => {
		if (yaArranco) return;
		yaArranco = true;
		if (data.usuario && esNegocioValido(data.negocio)) {
			void generarAnalisis();
		}
	});

	onDestroy(() => {
		detenerEtapas();
		abortController?.abort();
	});

	const competencia: EstablecimientoDenue[] = $derived(resultado?.competencia_considerada ?? []);

	// Flujo peatonal sintético: baraja determinista por nombre del negocio + score,
	// de modo que el mismo negocio siempre vea las mismas barras.
	const flujoPeatonal = $derived(() => {
		if (!resultado) return { nivel: 'medio' as NivelFlujo, bajo: 120, medio: 450, alto: 980 };
		const nombreNegocio = typeof data.negocio?.nombre === 'string' ? data.negocio.nombre : 'x';
		const seed = nombreNegocio.length + resultado.semaforo.score;
		const bajo = 80 + (seed % 90);
		const medio = 380 + ((seed * 7) % 220);
		const alto = 920 + ((seed * 13) % 280);
		// El nivel global se infiere del score del semáforo.
		const nivel: NivelFlujo =
			resultado.semaforo.color === 'rojo'
				? 'bajo'
				: resultado.semaforo.color === 'verde'
					? 'alto'
					: 'medio';
		return { nivel, bajo, medio, alto };
	});
</script>

<svelte:head>
	<title>Demo — NegociaCDMX</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<SiteHeader maxWidth="3xl">
		<a href={resolve('/')} class="text-sm text-neutral-500 hover:text-gob">Inicio</a>
	</SiteHeader>

	<div class="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
		{#if data.usuario && esNegocioValido(data.negocio)}
			<div
				role="status"
				aria-live="polite"
				class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
			>
				¡Registro completo, {data.usuario.nombre}! Este es el análisis de viabilidad para
				<strong>{data.negocio.nombre}</strong>.
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="rounded-xl border border-neutral-200 bg-white p-6">
					<h2 class="mb-3 text-sm font-semibold tracking-wide text-neutral-500 uppercase">Dueño</h2>
					<dl class="space-y-1 text-sm">
						<div>
							<dt class="inline text-neutral-500">Nombre:</dt>
							<dd class="inline">
								{data.usuario.nombre}
								{data.usuario.apellido_pat}
								{data.usuario.apellido_mat ?? ''}
							</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Teléfono:</dt>
							<dd class="inline">{data.usuario.telefono}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Correo:</dt>
							<dd class="inline">{data.usuario.correo}</dd>
						</div>
					</dl>
				</div>
				<div class="rounded-xl border border-neutral-200 bg-white p-6">
					<h2 class="mb-3 text-sm font-semibold tracking-wide text-neutral-500 uppercase">
						Negocio
					</h2>
					<dl class="space-y-1 text-sm">
						<div>
							<dt class="inline text-neutral-500">Nombre:</dt>
							<dd class="inline">{data.negocio.nombre}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Giro:</dt>
							<dd class="inline">{giroLabel}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Ramo:</dt>
							<dd class="inline">{data.negocio.ramo ?? '—'}</dd>
						</div>
						<div>
							<dt class="inline text-neutral-500">Figura moral:</dt>
							<dd class="inline">
								{data.negocio.tiene_razon_social === 1
									? `${data.negocio.razon_social ?? ''} (RFC ${data.negocio.rfc ?? ''})`
									: 'Persona física / por constituir'}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			<!-- Sección de negocios aledaños con DENUE (mapa del equipo) -->
			<div class="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
				<div class="flex items-center justify-between gap-4 border-b border-neutral-200 px-6 py-4">
					<div>
						<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
							Negocios aledaños
						</h2>
						<p class="mt-1 text-sm text-neutral-600">
							Competencia dentro de 1 km en el giro <strong>{giroLabel}</strong> — datos del DENUE · INEGI.
						</p>
					</div>
					<span class="hidden text-xs text-neutral-400 sm:block">DENUE · INEGI</span>
				</div>
				<div class="p-6">
					<MapaDenue
						cp={data.negocio.cp}
						calle={data.negocio.calle}
						colonia={data.negocio.colonia}
						{keyword}
					/>
				</div>
			</div>

			<!-- Análisis de viabilidad (IA + semáforo) -->
			<section class="mt-8" aria-label="Análisis de viabilidad">
				<header class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-neutral-900">Análisis de viabilidad</h2>
					{#if estado !== 'loading'}
						<button
							type="button"
							onclick={reintentar}
							class="rounded-md px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
						>
							{estado === 'done' ? 'Regenerar' : 'Reintentar'}
						</button>
					{/if}
				</header>

				{#if estado === 'loading'}
					<RadarCarga etapas={etapasFiltro} {etapaActual} />
				{:else if estado === 'error'}
					<div
						role="alert"
						aria-live="assertive"
						class="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm"
					>
						<h3 class="text-sm font-semibold text-rose-800">No se pudo generar el análisis</h3>
						<p class="mt-1 text-sm text-rose-700">{errorMsg}</p>
						<p class="mt-2 text-xs text-rose-600">
							Verifica tu GEMINI_API_KEY en .env o inténtalo de nuevo.
						</p>
					</div>
				{:else if estado === 'done' && resultado}
					<div class="space-y-4">
						<Semaforo semaforo={resultado.semaforo} />
						<FlujoPeatonal
							nivel={flujoPeatonal().nivel}
							bajo={flujoPeatonal().bajo}
							medio={flujoPeatonal().medio}
							alto={flujoPeatonal().alto}
							zona={zonaAnalisis()}
						/>
						<RutaAccion color={resultado.semaforo.color} />
						<ReporteCard markdown={resultado.reporte_markdown} {competencia} />
						<p class="text-center text-xs text-neutral-500">
							Análisis generado el {new Date(resultado.generado_en).toLocaleString('es-MX', {
								dateStyle: 'medium',
								timeStyle: 'short'
							})}
						</p>
					</div>
				{/if}
			</section>
		{:else}
			<div class="rounded-xl border border-neutral-200 bg-white p-10 text-center">
				<p class="text-neutral-600">
					Aún no hay un registro en esta sesión. Si completaste el formulario, tus datos no se
					persisten en este dispositivo.
				</p>
				<a
					href={resolve('/registro')}
					class="mt-4 inline-block rounded-lg bg-gob px-6 py-2.5 font-semibold text-white transition hover:bg-gob-dark"
				>
					Comenzar registro
				</a>
			</div>
		{/if}
	</div>
</div>
