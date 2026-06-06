<script lang="ts">
	import { resolve } from '$app/paths';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { GIROS } from '$lib/registro';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Validación defensiva del load. Aunque la forma viene del server con tipos,
	// un cambio de esquema o un partial en runtime podría dejar campos faltantes.
	function esNegocioValido(v: unknown): v is {
		nombre: string;
		giro: string;
		ramo: string | null;
		tiene_razon_social: number;
		razon_social: string | null;
		rfc: string | null;
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
</script>

<svelte:head>
	<title>Demo — NegociaCDMX</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<SiteHeader maxWidth="3xl">
		<a href={resolve('/')} class="text-sm text-neutral-500 hover:text-gob">Inicio</a>
	</SiteHeader>

	<div class="mx-auto max-w-3xl px-6 py-10">
		{#if data.usuario && esNegocioValido(data.negocio)}
			<div
				role="status"
				aria-live="polite"
				class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
			>
				¡Registro completo, {data.usuario.nombre}! Este es un adelanto del análisis que prepararemos
				para <strong>{data.negocio.nombre}</strong>.
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

			<div
				class="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-500"
			>
				<p class="font-medium text-neutral-700">Próximamente</p>
				<p class="mt-1 text-sm">
					Análisis de viabilidad por zona, afluencia, competencia, trámites y programas de la CDMX.
				</p>
			</div>
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
