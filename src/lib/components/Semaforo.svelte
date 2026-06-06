<script lang="ts">
	// Componente Semaforo: visualización de 3 luces + score + razón + alertas.
	// Recibe un SemaforoResultado y lo pinta. Sin estado interno.

	import type { SemaforoResultado, SemaforoColor } from '$lib/viabilidad/types';

	interface Props {
		semaforo: SemaforoResultado;
	}

	let { semaforo }: Props = $props();

	const labelPorColor: Record<SemaforoColor, string> = {
		verde: 'Viable',
		amarillo: 'Viable con reservas',
		rojo: 'Riesgo alto'
	};

	const colorClasses: Record<SemaforoColor, string> = {
		verde: 'bg-emerald-500 ring-emerald-600',
		amarillo: 'bg-amber-400 ring-amber-500',
		rojo: 'bg-rose-500 ring-rose-600'
	};

	const textoClasses: Record<SemaforoColor, string> = {
		verde: 'text-emerald-700',
		amarillo: 'text-amber-700',
		rojo: 'text-rose-700'
	};

	const orden: SemaforoColor[] = ['rojo', 'amarillo', 'verde'];

	const score = $derived(Math.max(0, Math.min(100, semaforo.score)));
</script>

<section
	aria-label="Semáforo de viabilidad"
	class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
>
	<header class="mb-4 flex items-center justify-between">
		<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
			Semáforo de viabilidad
		</h2>
		<span class="text-2xl font-bold tabular-nums {textoClasses[semaforo.color]}">
			{score}<span class="text-sm font-normal text-neutral-400">/100</span>
		</span>
	</header>

	<div class="flex items-center justify-center gap-4 sm:gap-6" role="img">
		{#each orden as color (color)}
			{@const activo = color === semaforo.color}
			<div class="flex flex-col items-center gap-2">
				<span
					class="h-12 w-12 rounded-full ring-2 transition-all duration-300 sm:h-14 sm:w-14
						{activo ? colorClasses[color] : 'bg-neutral-200 ring-neutral-300 opacity-40'}"
					aria-hidden="true"
				></span>
				<span
					class="text-[10px] font-medium uppercase tracking-wide
						{activo ? textoClasses[color] : 'text-neutral-400'}"
				>
					{labelPorColor[color]}
				</span>
			</div>
		{/each}
	</div>

	<p class="mt-5 text-center text-sm font-medium text-neutral-800">
		<span class="sr-only">Veredicto: </span>
		{labelPorColor[semaforo.color]}
	</p>

	{#if semaforo.razon}
		<p class="mt-1 text-center text-sm text-neutral-600">{semaforo.razon}</p>
	{/if}

	{#if semaforo.alertas.length > 0}
		<ul class="mt-4 space-y-1.5 text-sm" aria-label="Alertas del análisis">
			{#each semaforo.alertas as alerta, i (i)}
				<li class="flex items-start gap-2 text-neutral-700">
					<span class="mt-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gob"></span>
					<span>{alerta}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>
