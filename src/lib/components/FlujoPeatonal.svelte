<script lang="ts">
	// Componente FlujoPeatonal: gráfica de barras (3 niveles) con el flujo
	// peatonal estimado para la zona. Sin dependencias externas — solo SVG.
	// Accesible: role="img" con texto alternativo y tabla visual de fallback.

	interface Props {
		/** Nivel global: "bajo" | "medio" | "alto". */
		nivel: 'bajo' | 'medio' | 'alto';
		/** Conteos estimados por nivel (opcional). Si se omite, se usan los del mock. */
		bajo?: number;
		medio?: number;
		alto?: number;
		/** Zona o colonia (para el caption). */
		zona?: string;
	}

	let { nivel, bajo = 120, medio = 450, alto = 980, zona = 'la zona' }: Props = $props();

	// Normalizamos a escala 0-100 respecto al valor máximo.
	const max = $derived(Math.max(bajo, medio, alto, 1));
	const pctBajo = $derived(Math.round((bajo / max) * 100));
	const pctMedio = $derived(Math.round((medio / max) * 100));
	const pctAlto = $derived(Math.round((alto / max) * 100));

	const labelPorNivel: Record<typeof nivel, string> = {
		bajo: 'Bajo',
		medio: 'Medio',
		alto: 'Alto'
	};

	const descripcion: Record<typeof nivel, string> = {
		bajo: 'tránsito bajo',
		medio: 'tránsito moderado',
		alto: 'tránsito alto'
	};
</script>

<section
	aria-label="Flujo peatonal estimado"
	class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
>
	<header class="mb-4">
		<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
			Flujo peatonal estimado
		</h2>
		<p class="mt-1 text-xs text-neutral-500">
			Datos sintéticos para {zona}. Personas/día estimadas en la acera del local.
		</p>
	</header>

	<!-- Gráfica SVG con 3 barras. -->
	<svg
		viewBox="0 0 320 180"
		class="w-full"
		role="img"
		aria-label={`Flujo peatonal en ${zona}: bajo ${bajo}, medio ${medio}, alto ${alto} personas por día. Nivel general: ${labelPorNivel[nivel]}.`}
	>
		<!-- Eje X (línea base) -->
		<line x1="20" y1="150" x2="300" y2="150" stroke="#e5e5e5" stroke-width="1" />

		<!-- Barra bajo -->
		<rect
			x={50}
			y={150 - (pctBajo / 100) * 120}
			width={60}
			height={(pctBajo / 100) * 120}
			fill="#fbbf24"
			rx="4"
			opacity="0.4"
		/>
		<text x={50 + 60 / 2} y="165" text-anchor="middle" class="fill-neutral-600" font-size="11"
			>Bajo</text
		>
		<text
			x={50 + 60 / 2}
			y={150 - (pctBajo / 100) * 120 - 5}
			text-anchor="middle"
			class="fill-neutral-700"
			font-size="11"
			font-weight="600"
		>
			{bajo}
		</text>

		<!-- Barra medio -->
		<rect
			x={130}
			y={150 - (pctMedio / 100) * 120}
			width={60}
			height={(pctMedio / 100) * 120}
			fill="#f59e0b"
			rx="4"
			opacity={nivel === 'medio' ? '1' : '0.45'}
		/>
		<text x={130 + 60 / 2} y="165" text-anchor="middle" class="fill-neutral-600" font-size="11"
			>Medio</text
		>
		<text
			x={130 + 60 / 2}
			y={150 - (pctMedio / 100) * 120 - 5}
			text-anchor="middle"
			class="fill-neutral-700"
			font-size="11"
			font-weight="600"
		>
			{medio}
		</text>

		<!-- Barra alto -->
		<rect
			x={210}
			y={150 - (pctAlto / 100) * 120}
			width={60}
			height={(pctAlto / 100) * 120}
			fill="#a02142"
			rx="4"
			opacity={nivel === 'alto' ? '1' : '0.45'}
		/>
		<text x={210 + 60 / 2} y="165" text-anchor="middle" class="fill-neutral-600" font-size="11"
			>Alto</text
		>
		<text
			x={210 + 60 / 2}
			y={150 - (pctAlto / 100) * 120 - 5}
			text-anchor="middle"
			class="fill-neutral-700"
			font-size="11"
			font-weight="600"
		>
			{alto}
		</text>
	</svg>

	<p class="mt-3 text-center text-sm text-neutral-700">
		Nivel estimado: <strong class="text-gob-dark">{labelPorNivel[nivel]}</strong>
		<span class="text-neutral-500">({descripcion[nivel]} en la zona)</span>
	</p>
</section>
