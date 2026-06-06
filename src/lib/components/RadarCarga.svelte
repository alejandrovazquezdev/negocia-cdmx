<script lang="ts">
	// Componente RadarCarga: animación de "radar" con anillos concéntricos que
	// pulsan y una lista de etapas de verificación que se van marcando.
	// El padre controla qué etapa está activa y cuáles ya pasaron.

	interface Props {
		/** Etapas a mostrar. */
		etapas: string[];
		/** Índice de la etapa en curso (0-based). Las anteriores aparecen como "completadas". */
		etapaActual: number;
	}

	let { etapas, etapaActual }: Props = $props();
</script>

<div
	role="status"
	aria-live="polite"
	aria-busy="true"
	class="rounded-2xl border border-gob/30 bg-gob-soft p-8 shadow-sm"
>
	<div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
		<!-- Radar SVG con 3 anillos pulsantes -->
		<div class="relative h-40 w-40 flex-shrink-0" aria-hidden="true">
			<!-- Línea de barrido -->
			<div
				class="absolute inset-0 animate-[spin_2.4s_linear_infinite] rounded-full bg-gradient-to-tr from-transparent via-gob/30 to-transparent"
			></div>

			<!-- Anillos concéntricos -->
			<svg viewBox="0 0 100 100" class="absolute inset-0 h-full w-full">
				<circle
					cx="50"
					cy="50"
					r="48"
					fill="none"
					stroke="#a02142"
					stroke-width="0.5"
					opacity="0.4"
				/>
				<circle
					cx="50"
					cy="50"
					r="36"
					fill="none"
					stroke="#a02142"
					stroke-width="0.5"
					opacity="0.5"
				/>
				<circle
					cx="50"
					cy="50"
					r="24"
					fill="none"
					stroke="#a02142"
					stroke-width="0.5"
					opacity="0.6"
				/>
				<circle
					cx="50"
					cy="50"
					r="12"
					fill="none"
					stroke="#a02142"
					stroke-width="0.5"
					opacity="0.7"
				/>
				<!-- Cruz guía -->
				<line x1="2" y1="50" x2="98" y2="50" stroke="#a02142" stroke-width="0.3" opacity="0.3" />
				<line x1="50" y1="2" x2="50" y2="98" stroke="#a02142" stroke-width="0.3" opacity="0.3" />
			</svg>

			<!-- Pulso central -->
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="h-3 w-3 animate-ping rounded-full bg-gob opacity-75"></div>
				<div class="absolute h-3 w-3 rounded-full bg-gob"></div>
			</div>

			<!-- Puntos detectados (decorativos, simulando "blips" del radar) -->
			<div
				class="absolute h-1.5 w-1.5 rounded-full bg-gob-light opacity-70"
				style="top: 30%; left: 60%; animation: ping 3s ease-out infinite;"
			></div>
			<div
				class="absolute h-1.5 w-1.5 rounded-full bg-gob-light opacity-70"
				style="top: 70%; left: 35%; animation: ping 3.5s ease-out infinite 0.6s;"
			></div>
			<div
				class="absolute h-1.5 w-1.5 rounded-full bg-gob-light opacity-70"
				style="top: 50%; left: 75%; animation: ping 4s ease-out infinite 1.2s;"
			></div>
		</div>

		<!-- Lista de etapas -->
		<div class="flex-1">
			<p class="text-sm font-semibold text-gob-dark">Filtro de verificación</p>
			<p class="mt-0.5 text-xs text-neutral-600">
				Estamos confirmando tu información antes de darte el análisis. Los datos sintéticos se
				cruzan con bases públicas.
			</p>

			<ol class="mt-4 space-y-2" aria-label="Etapas del filtro">
				{#each etapas as texto, i (i)}
					{@const completada = i < etapaActual}
					{@const activa = i === etapaActual}
					<li
						class="flex items-center gap-3 rounded-md border px-3 py-1.5 text-sm transition
							{activa
							? 'border-gob bg-white font-medium text-gob-dark shadow-sm'
							: completada
								? 'border-gob/20 bg-white/60 text-neutral-700'
								: 'border-neutral-200 bg-white/40 text-neutral-500'}"
					>
						<span
							class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold
								{activa
								? 'bg-gob text-white'
								: completada
									? 'bg-gob-dark text-white'
									: 'bg-neutral-200 text-neutral-500'}"
						>
							{#if completada}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									class="h-3 w-3"
									aria-hidden="true"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							{:else if activa}
								<span class="block h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span>
							{:else}
								{i + 1}
							{/if}
						</span>
						<span class="flex-1">{texto}</span>
						{#if activa}
							<span class="text-xs text-gob-dark">en curso…</span>
						{:else if completada}
							<span class="text-xs text-gob-dark/70">ok</span>
						{/if}
					</li>
				{/each}
			</ol>
		</div>
	</div>
</div>
