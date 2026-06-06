<script lang="ts">
	// Componente RutaAccion: hoja de ruta del emprendedor según el semáforo
	// de viabilidad. Cada paso es una decisión estratégica O un trámite
	// formal concreto (SAT, CDMX, IMSS, IMPI) — ordenados por prioridad
	// según el color. La lista NO es exhaustiva ni asesoría legal: cada
	// portal oficial debe verificarse al momento de ejecutar.

	import type { SemaforoColor } from '$lib/viabilidad/types';

	interface Props {
		color: SemaforoColor;
	}

	let { color }: Props = $props();

	type Paso = {
		emoji: string;
		titulo: string;
		detalle: string;
		ente?: string; // 'SAT' | 'CDMX' | 'IMSS' | 'IMPI' | 'SAT/CDMX' — badge visual
	};

	const planes: Record<SemaforoColor, { encabezado: string; pasos: Paso[]; nota: string }> = {
		verde: {
			encabezado: 'Zona despejada — formaliza rápido y lanza',
			pasos: [
				{
					emoji: '🪪',
					ente: 'SAT',
					titulo: 'Tramita tu RFC con Homoclave y e.firma',
					detalle:
						'Prerrequisito de todo lo demás. Persona física o moral según tu figura. sat.gob.mx → Trámites → RFC. Gratis, ~30 min en línea. La e.firma (antes FIEL) se agenda en oficina del SAT y toma ~2 semanas; agéndala ya.'
				},
				{
					emoji: '🗺️',
					ente: 'CDMX',
					titulo: 'Verifica el uso de suelo permitido',
					detalle:
						'Antes de firmar contrato, confirma en el Sistema de Consulta de Uso de Suelo (suelo.consejeria.cdmx.gob.mx) que tu giro está permitido en el domicilio. Si no, ningún trámite posterior sirve.'
				},
				{
					emoji: '📄',
					ente: 'CDMX',
					titulo: 'Licencia de Funcionamiento de bajo impacto',
					detalle:
						'En línea en ventanilla.cdmx.gob.mx para giros de bajo impacto en locales <100 m². Resolución ~5 días hábiles. Costo ~$1,500-$4,000 según alcaldía.'
				},
				{
					emoji: '💸',
					ente: 'SAT',
					titulo: 'Alta en RESICO si eres persona física',
					detalle:
						'Régimen Simplificado de Confianza con tasas desde 1% si tus ingresos estimados no superan $2M/año. Una vez dado de alta, no necesitas presentar declaraciones mensuales.'
				},
				{
					emoji: '👥',
					ente: 'IMSS',
					titulo: 'Alta patronal solo si tendrás empleados',
					detalle:
						'Personas físicas sin empleados NO se dan de alta como patrones. Si contratarás, hazlo en el Portal del IMSS (idse.imss.gob.mx) antes del primer pago de nómina.'
				},
				{
					emoji: '™️',
					ente: 'IMPI',
					titulo: 'Registra tu marca en IMPI (opcional pero recomendado)',
					detalle:
						'~$2,500 MXN en línea en gob.mx/impi. Protege el nombre comercial 10 años renovables. Hazlo ANTES de gastar en rotulación y redes — un conflicto de marca posterior te costaría más.'
				}
			],
			nota: 'Zona con baja competencia: el riesgo es demorarte, no la demanda. Cierra la formalización en 30 días.'
		},
		amarillo: {
			encabezado: 'Competencia moderada — valida antes de formalizar',
			pasos: [
				{
					emoji: '🎯',
					titulo: 'Define tu diferenciación concreta',
					detalle:
						'¿Qué harás que los competidores cercanos NO hacen? Nicho de producto, precio, ambiente, servicio. Una sola frase que el cliente repetiría. Sin esto, los siguientes pasos pierden sentido.'
				},
				{
					emoji: '🛒',
					titulo: 'Valida con clientes reales antes de rentar',
					detalle:
						'Encuesta, preventa o prueba piloto de 2-4 semanas. Mínimo 10-15 compromisos de compra ("te lo vendo a $X, ¿lo comprarías?"). El semáforo es indicativo; la calle manda.'
				},
				{
					emoji: '🪪',
					ente: 'SAT',
					titulo: 'RFC + e.firma como base (gratis, sin riesgo)',
					detalle:
						'Hazlo ya aunque no tengas local: te abre cuentas de empresa, contratos a tu nombre y facturación. sat.gob.mx. No te compromete a abrir mañana.'
				},
				{
					emoji: '🏠',
					titulo: 'Negocia contrato con opción a prueba',
					detalle:
						'Alquila con cláusula de salida a 6 meses o período de prueba. NO remodeles ni firmes a 3+ años hasta validar ventas reales. Renta + depósito + primer mes suelen ser suficientes para empezar.'
				},
				{
					emoji: '📄',
					ente: 'CDMX',
					titulo: 'Licencia de Funcionamiento solo cuando firmes local',
					detalle:
						'No pagues licencia hasta tener contrato. Cuando llegue el momento, ventanilla.cdmx.gob.mx en línea para bajo impacto, ~5 días hábiles.'
				},
				{
					emoji: '™️',
					ente: 'IMPI',
					titulo: 'Registra tu marca antes de rotular',
					detalle:
						'Especialmente importante en zona competida: si tu nombre es bueno, alguien lo va a registrar primero. gob.mx/impi en línea, ~$2,500.'
				}
			],
			nota: 'Aquí la diferencia entre éxito y fracaso está en validar ANTES de firmar. Sal a la calle antes de ir a la ventanilla.'
		},
		rojo: {
			encabezado: 'Zona saturada — replantea ANTES de formalizar',
			pasos: [
				{
					emoji: '🧠',
					titulo: 'Hazte 3 preguntas duras',
					detalle:
						'¿Por qué tú y no los que ya están ahí? ¿Cuánto capital extra necesitas para destacar? ¿Cuánto tiempo sobrevivirías si no llegas a punto de equilibrio en 6 meses? Si no tienes respuesta convincente, sigue replanteando.'
				},
				{
					emoji: '🗺️',
					ente: 'CDMX',
					titulo: 'Compara colonias a 1-2 km con DENUE',
					detalle:
						'Usa el mapa DENUE para encontrar zonas con menos densidad de tu giro. Una calle menos transitada con la misma clientela meta puede darte semáforo verde. No te cases con la dirección.'
				},
				{
					emoji: '🔄',
					titulo: 'Considera giro complementario o modelo sin local',
					detalle:
						'A veces la colonia y el cliente son correctos, pero el producto no. Explora giros que aprovechen la clientela meta sin chocar de frente con los existentes. Venta online o servicio a domicilio eliminan el problema de ubicación.'
				},
				{
					emoji: '🛑',
					titulo: 'NO inicies trámites de local todavía',
					detalle:
						'Suspende cualquier gasto en contrato, depósito, licencia, remodelación. Estos NO son recuperables si pivotas. Cada semana que aguantes sin firmar es una semana de información.'
				},
				{
					emoji: '🪪',
					ente: 'SAT',
					titulo: 'Si decides seguir: solo RFC + e.firma',
					detalle:
						'Lo único que vale la pena hacer mientras replanteas. Es gratis, no te compromete a abrir, y te deja listo si eventualmente decides avanzar. sat.gob.mx en línea.'
				}
			],
			nota: 'Mejor parar y repensar 2 meses que abrir y quebrar a los 8. El semáforo rojo no es un veredicto: es una señal de que el plan actual tiene un problema que puedes resolver.'
		}
	};

	const plan = $derived(planes[color]);
	const colorClasses: Record<SemaforoColor, string> = {
		verde: 'border-emerald-200 bg-emerald-50',
		amarillo: 'border-amber-200 bg-amber-200/20',
		rojo: 'border-rose-200 bg-rose-50'
	};

	// Colores del badge por ente
	const enteClasses: Record<NonNullable<Paso['ente']>, string> = {
		SAT: 'bg-blue-100 text-blue-800',
		CDMX: 'bg-purple-100 text-purple-800',
		IMSS: 'bg-teal-100 text-teal-800',
		IMPI: 'bg-orange-100 text-orange-800',
		'SAT/CDMX': 'bg-blue-100 text-blue-800'
	};
</script>

<section
	aria-label="Ruta de acción y trámites recomendados"
	class="rounded-2xl border-2 {colorClasses[color]} p-6 shadow-sm"
>
	<header class="mb-4">
		<h2 class="text-base font-semibold text-neutral-900">{plan.encabezado}</h2>
		<p class="mt-1 text-xs text-neutral-600">
			Pasos estratégicos y trámites formales ante SAT, CDMX, IMSS e IMPI, según el semáforo.
			Verifica requisitos actualizados en cada portal antes de ejecutar.
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
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
						<h3 class="text-sm font-semibold text-neutral-900">
							<span aria-hidden="true">{paso.emoji}</span>
							{paso.titulo}
						</h3>
						{#if paso.ente}
							<span
								class="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase {enteClasses[
									paso.ente
								] ?? 'bg-neutral-100 text-neutral-700'}"
							>
								{paso.ente}
							</span>
						{/if}
					</div>
					<p class="mt-1 text-sm text-neutral-700">{paso.detalle}</p>
				</div>
			</li>
		{/each}
	</ol>

	<p class="mt-4 border-t border-neutral-200 pt-3 text-xs italic text-neutral-600">
		{plan.nota}
	</p>
</section>
