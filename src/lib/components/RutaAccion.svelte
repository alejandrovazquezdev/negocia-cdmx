<script lang="ts">
	// Componente RutaAccion: muestra la hoja de ruta según el color del semáforo.
	// Verde: lanza. Amarillo: diferencia. Rojo: pivotea.

	import type { SemaforoColor } from '$lib/viabilidad/types';

	interface Props {
		color: SemaforoColor;
	}

	let { color }: Props = $props();

	type Paso = { titulo: string; detalle: string; emoji: string };

	const planes: Record<SemaforoColor, { encabezado: string; pasos: Paso[]; nota: string }> = {
		verde: {
			encabezado: 'Zona despejada — acelera tu lanzamiento',
			pasos: [
				{
					emoji: '🧭',
					titulo: 'Valida la afluencia real',
					detalle:
						'Cuenta peatones en 3 horarios (mañana, mediodía, tarde) durante 5 días hábiles. El semáforo es indicativo; la calle manda.'
				},
				{
					emoji: '📄',
					titulo: 'Prepara tu aviso de funcionamiento',
					detalle:
						'Con tu CURP, RFC y comprobante de domicilio puedes sacar el aviso ante la alcaldía por la ventanilla única (RETyS) en menos de 1 día.'
				},
				{
					emoji: '🚀',
					titulo: 'Lanza un MVP y mide',
					detalle:
						'Prueba el concepto 30 días con un menú/producto mínimo. Ajusta precio, horario y oferta con base en ventas reales antes de invertir en local fijo.'
				}
			],
			nota: 'Buen momento para capitalizar la baja competencia, pero no la confundas con demanda.'
		},
		amarillo: {
			encabezado: 'Competencia moderada — necesitas diferenciarte',
			pasos: [
				{
					emoji: '🎯',
					titulo: 'Define tu propuesta de valor única',
					detalle:
						'¿Qué harás que los 2-3 competidores cercanos no hacen? Nicho de menú, especialidad, precio, ambiente, servicio. Escribe una frase que el cliente repetiría.'
				},
				{
					emoji: '🔍',
					titulo: 'Estudia a los competidores directos',
					detalle:
						'Visita cada uno: anota precio, plato estrella, horario, personal, redes. Identifica su talón de Aquiles y constrúyete alrededor.'
				},
				{
					emoji: '💰',
					titulo: 'Calcula tu punto de equilibrio con números reales',
					detalle:
						'Con la renta promedio de la zona + costos fijos, ¿cuántas unidades/día necesitas vender? Sé honesto antes de firmar contrato.'
				},
				{
					emoji: '📣',
					titulo: 'Presupuesta marketing de lanzamiento',
					detalle:
						'La competencia moderada no te mata, te ahoga si no te ven. Separa 15% del capital inicial para redes y volanteo en la colonia.'
				}
			],
			nota: 'Aquí la diferencia entre éxito y fracaso está en la ejecución. Sal a la calle y valida antes de rentar.'
		},
		rojo: {
			encabezado: 'Zona saturada — pivotea o reubícate',
			pasos: [
				{
					emoji: '🧠',
					titulo: 'Hazte 3 preguntas duras',
					detalle:
						'¿Por qué tú y no los que ya están ahí? ¿Cuánto capital extra necesitas para destacar? ¿Cuánto tiempo sobrevivirías si no llegas a punto de equilibrio en 6 meses?'
				},
				{
					emoji: '🔄',
					titulo: 'Considera pivotar el giro o el sub-ramo',
					detalle:
						'A veces la colonia y el cliente son los correctos, pero el producto no. Explora giros complementarios que no estén saturados en la zona.'
				},
				{
					emoji: '📍',
					titulo: 'Explora colonias a 1-2 km',
					detalle:
						'Una calle menos transitada con la misma clientela meta puede darte la viabilidad verde. No te cases con la dirección.'
				}
			],
			nota: 'Mejor parar y repensar que abrir y quebrar a los 8 meses.'
		}
	};

	const plan = $derived(planes[color]);
	const colorClasses: Record<SemaforoColor, string> = {
		verde: 'border-emerald-200 bg-emerald-50',
		amarillo: 'border-amber-200 bg-amber-50',
		rojo: 'border-rose-200 bg-rose-50'
	};
</script>

<section
	aria-label="Ruta de acción recomendada"
	class="rounded-2xl border-2 {colorClasses[color]} p-6 shadow-sm"
>
	<header class="mb-4">
		<h2 class="text-base font-semibold text-neutral-900">{plan.encabezado}</h2>
		<p class="mt-1 text-xs text-neutral-600">
			Pasos concretos según el semáforo. Verifica con fuentes oficiales antes de actuar.
		</p>
	</header>

	<ol class="space-y-3">
		{#each plan.pasos as paso, i (i)}
			<li class="flex gap-3 rounded-lg bg-white p-3 shadow-sm">
				<span
					class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gob text-sm font-bold text-white"
					aria-hidden="true"
				>
					{i + 1}
				</span>
				<div>
					<h3 class="text-sm font-semibold text-neutral-900">
						<span aria-hidden="true">{paso.emoji}</span>
						{paso.titulo}
					</h3>
					<p class="mt-1 text-sm text-neutral-700">{paso.detalle}</p>
				</div>
			</li>
		{/each}
	</ol>

	<p class="mt-4 border-t border-neutral-200 pt-3 text-xs italic text-neutral-600">
		{plan.nota}
	</p>
</section>
