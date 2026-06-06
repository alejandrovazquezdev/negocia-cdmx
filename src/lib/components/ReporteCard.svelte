<script lang="ts">
	// Componente ReporteCard: renderiza el markdown del reporte con una
	// mini-whitelist (mismo patrón que ChatWidget) — no se usa {@html}.

	import type { EstablecimientoDenue } from '$lib/viabilidad/types';

	interface Props {
		/** Reporte en markdown. */
		markdown: string;
		/** Competidores DENUE que se consideraron (opcional, para tabla al pie). */
		competencia?: EstablecimientoDenue[];
	}

	let { markdown, competencia = [] }: Props = $props();

	interface Bloque {
		tipo: 'h2' | 'h3' | 'p' | 'ul' | 'ol';
		contenido: string | string[];
	}

	function parsear(md: string): Bloque[] {
		const bloques: Bloque[] = [];
		const lineas = md.split('\n');
		let i = 0;

		while (i < lineas.length) {
			const linea = lineas[i].trim();

			if (!linea) {
				i++;
				continue;
			}

			if (linea.startsWith('### ')) {
				bloques.push({ tipo: 'h3', contenido: linea.slice(4) });
				i++;
				continue;
			}
			if (linea.startsWith('## ')) {
				bloques.push({ tipo: 'h2', contenido: linea.slice(3) });
				i++;
				continue;
			}

			// Lista no ordenada.
			if (linea.startsWith('- ') || linea.startsWith('* ')) {
				const items: string[] = [];
				while (i < lineas.length) {
					const l = lineas[i].trim();
					if (!l.startsWith('- ') && !l.startsWith('* ')) break;
					items.push(l.slice(2));
					i++;
				}
				bloques.push({ tipo: 'ul', contenido: items });
				continue;
			}

			// Lista ordenada.
			if (/^\d+\.\s/.test(linea)) {
				const items: string[] = [];
				while (i < lineas.length) {
					const l = lineas[i].trim();
					if (!/^\d+\.\s/.test(l)) break;
					items.push(l.replace(/^\d+\.\s/, ''));
					i++;
				}
				bloques.push({ tipo: 'ol', contenido: items });
				continue;
			}

			// Párrafo (puede ocupar varias líneas hasta línea vacía o encabezado).
			let parrafo = linea;
			i++;
			while (
				i < lineas.length &&
				lineas[i].trim() &&
				!lineas[i].trim().startsWith('#') &&
				!lineas[i].trim().startsWith('- ') &&
				!lineas[i].trim().startsWith('* ') &&
				!/^\d+\.\s/.test(lineas[i].trim())
			) {
				parrafo += ' ' + lineas[i].trim();
				i++;
			}
			bloques.push({ tipo: 'p', contenido: parrafo });
		}

		return bloques;
	}

	const bloques = $derived(parsear(markdown));

	/** Guarda el reporte como PDF usando el diálogo de impresión del navegador. */
	function descargarPdf() {
		// En el navegador, el usuario elige "Guardar como PDF" en el diálogo.
		window.print();
	}
</script>

<section
	aria-label="Reporte de viabilidad"
	class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
>
	<header class="mb-4 flex items-start justify-between gap-4">
		<div>
			<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
				Reporte de viabilidad
			</h2>
			<p class="mt-1 text-xs text-neutral-500">
				Generado por IA con base en el dataset DENUE de la zona.
			</p>
		</div>
		<button
			type="button"
			onclick={descargarPdf}
			class="print:hidden flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-gob hover:bg-gob-soft hover:text-gob-dark"
			aria-label="Descargar reporte como PDF"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-3.5 w-3.5"
				aria-hidden="true"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="7 10 12 15 17 10" />
				<line x1="12" y1="15" x2="12" y2="3" />
			</svg>
			Descargar PDF
		</button>
	</header>

	<div class="prose-sm space-y-3 text-sm leading-relaxed text-neutral-800">
		{#each bloques as b, i (i)}
			{#if b.tipo === 'h2'}
				<h3 class="mt-2 text-base font-semibold text-neutral-900">{b.contenido}</h3>
			{:else if b.tipo === 'h3'}
				<h4 class="text-sm font-semibold text-neutral-800">{b.contenido}</h4>
			{:else if b.tipo === 'p'}
				<p>{b.contenido}</p>
			{:else if b.tipo === 'ul'}
				<ul class="list-inside list-disc space-y-1">
					{#each b.contenido as item, j (j)}
						<li>{item}</li>
					{/each}
				</ul>
			{:else if b.tipo === 'ol'}
				<ol class="list-inside list-decimal space-y-1">
					{#each b.contenido as item, j (j)}
						<li>{item}</li>
					{/each}
				</ol>
			{/if}
		{/each}
	</div>

	{#if competencia.length > 0}
		<details class="mt-6 border-t border-neutral-200 pt-4">
			<summary
				class="cursor-pointer text-xs font-semibold tracking-wide text-neutral-600 uppercase hover:text-gob"
			>
				Dataset DENUE considerado ({competencia.length} establecimientos)
			</summary>
			<div class="mt-3 overflow-x-auto">
				<table class="w-full text-xs">
					<thead class="bg-neutral-50 text-neutral-600">
						<tr>
							<th class="px-2 py-1.5 text-left font-medium">Nombre</th>
							<th class="px-2 py-1.5 text-left font-medium">Actividad</th>
							<th class="px-2 py-1.5 text-left font-medium">Colonia</th>
							<th class="px-2 py-1.5 text-left font-medium">Estrato</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-100">
						{#each competencia as e (e.clee)}
							<tr>
								<td class="px-2 py-1.5 font-medium text-neutral-800">{e.nombre}</td>
								<td class="px-2 py-1.5 text-neutral-600">{e.clase_actividad}</td>
								<td class="px-2 py-1.5 text-neutral-600">{e.colonia}</td>
								<td class="px-2 py-1.5 text-neutral-600">{e.estrato}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>
	{/if}
</section>
