// Analyzer de viabilidad. Llama a Gemini, valida el JSON de salida y
// lo enriquece con los datos del dataset DENUE.
//
// NOTA: importa @google/generative-ai directo (no el wrapper del chatbot)
// porque el wrapper tiene un bug conocido en `generationConfig` que
// inyecta campos inválidos. Cuando ese wrapper se arregle, se puede
// consolidar.

import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import denueData from '$lib/data/denue-mock.json';
import type {
	AnalisisResultado,
	DenueDataset,
	EstablecimientoDenue,
	NegocioAnalizar,
	SemaforoColor,
	SemaforoResultado
} from './types';
import { VIABILIDAD_SYSTEM_PROMPT, buildViabilidadPrompt } from './prompt';

const dataset: DenueDataset = denueData as DenueDataset;

const DEFAULT_CONFIG: GenerationConfig = {
	temperature: 0.4,
	topP: 0.9,
	topK: 40,
	// gemini-2.5-flash es "thinking": parte del presupuesto se va en razonamiento
	// interno, por lo que necesitamos holgura para que el JSON final no salga truncado.
	maxOutputTokens: 4000
};

export class ViabilidadError extends Error {
	constructor(
		message: string,
		public readonly code:
			| 'NO_API_KEY'
			| 'INVALID_API_KEY'
			| 'RATE_LIMITED'
			| 'UPSTREAM'
			| 'INVALID_OUTPUT'
	) {
		super(message);
		this.name = 'ViabilidadError';
	}
}

/** Top N competidores más relevantes para el giro/ramo del usuario. */
function competidoresRelevantes(
	negocio: NegocioAnalizar,
	establecimientos: EstablecimientoDenue[],
	topN = 5
): EstablecimientoDenue[] {
	const giroLower = negocio.giro.toLowerCase();
	const ramoLower = negocio.ramo.toLowerCase();

	const scored = establecimientos.map((e) => {
		const clase = e.clase_actividad.toLowerCase();
		const subsector = e.id_subsector_actividad;
		const ramo = e.id_rama_actividad;

		let score = 0;
		// Misma rama SCIAN = competencia directa.
		if (ramo && ramo === e.id_rama_actividad) score += 5;
		// Mismo subsector = competencia cercana.
		if (subsector && subsector === e.id_subsector_actividad) score += 3;
		// Mismo giro declarado por el usuario.
		if (giroLower === 'servicios' && subsector === '722') score += 1;
		if (giroLower === 'comercial' && subsector === '461') score += 1;
		// Palabras del ramo del usuario aparecen en la clase DENUE.
		if (ramoLower && clase.includes(ramoLower)) score += 2;
		// Coincidencia de palabras sueltas del ramo (alimentos, tecnologia, etc.).
		for (const w of ramoLower.split(/\s+/).filter((w) => w.length > 3)) {
			if (clase.includes(w)) score += 1;
		}
		return { e, score };
	});

	return scored
		.sort((a, b) => b.score - a.score)
		.slice(0, topN)
		.map((s) => s.e);
}

/** Parsea la respuesta del modelo. Acepta JSON envuelto en ```json ... ```. */
function parseModelOutput(raw: string): { semaforo: SemaforoResultado; reporte_markdown: string } {
	let cleaned = raw.trim();

	// Quitar fences de markdown si los trae.
	const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fence) cleaned = fence[1].trim();

	let parsed: unknown;
	try {
		parsed = JSON.parse(cleaned);
	} catch {
		throw new ViabilidadError(
			`El modelo no devolvió un JSON válido. Salida: ${raw.slice(0, 200)}`,
			'INVALID_OUTPUT'
		);
	}

	if (!parsed || typeof parsed !== 'object') {
		throw new ViabilidadError('La salida del modelo no es un objeto JSON.', 'INVALID_OUTPUT');
	}

	const p = parsed as Record<string, unknown>;
	const s = p.semaforo as Record<string, unknown> | undefined;
	const reporte = p.reporte_markdown;

	if (!s || typeof s !== 'object') {
		throw new ViabilidadError(
			'Falta el campo "semaforo" en la salida del modelo.',
			'INVALID_OUTPUT'
		);
	}
	if (typeof reporte !== 'string') {
		throw new ViabilidadError(
			'Falta el campo "reporte_markdown" en la salida del modelo.',
			'INVALID_OUTPUT'
		);
	}

	const color = s.color;
	if (color !== 'verde' && color !== 'amarillo' && color !== 'rojo') {
		throw new ViabilidadError(`Color de semáforo inválido: ${String(color)}`, 'INVALID_OUTPUT');
	}
	const score = Number(s.score);
	if (!Number.isFinite(score) || score < 0 || score > 100) {
		throw new ViabilidadError(`Score de semáforo inválido: ${String(s.score)}`, 'INVALID_OUTPUT');
	}

	const alertas = Array.isArray(s.alertas)
		? s.alertas.filter((a): a is string => typeof a === 'string')
		: [];

	return {
		semaforo: {
			color: color as SemaforoColor,
			score: Math.round(score),
			razon: typeof s.razon === 'string' ? s.razon : '',
			alertas
		},
		reporte_markdown: reporte
	};
}

/** Genera el análisis de viabilidad para el negocio del usuario. */
export async function analizarViabilidad(negocio: NegocioAnalizar): Promise<AnalisisResultado> {
	// Modo simulación: si SIMULATE_VIABILIDAD=true en el entorno, devolvemos
	// una respuesta sintética determinista sin llamar a Gemini. Útil para
	// demos, CI y desarrollo sin gastar cuota. NO usar en producción.
	if (env.SIMULATE_VIABILIDAD === 'true') {
		return respuestaSintetica(negocio, dataset.establecimientos);
	}

	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new ViabilidadError(
			'GEMINI_API_KEY no está configurada. Define la variable en .env.',
			'NO_API_KEY'
		);
	}

	const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({
		model: modelName,
		systemInstruction: VIABILIDAD_SYSTEM_PROMPT,
		generationConfig: { ...DEFAULT_CONFIG, responseMimeType: 'application/json' }
	});

	const relevantes = competidoresRelevantes(negocio, dataset.establecimientos);

	const userPrompt = `${buildViabilidadPrompt(negocio)}

# Dataset DENUE de la zona (${dataset.establecimientos.length} establecimientos)

${JSON.stringify(relevantes, null, 2)}

# Recordatorio
- Devuelve SOLO el JSON con \`semaforo\` y \`reporte_markdown\`.
- Cita los nombres de los competidores relevantes en el reporte cuando los menciones.`;

	try {
		const result = await model.generateContent(userPrompt);
		const text = result.response.text();
		const { semaforo, reporte_markdown } = parseModelOutput(text);

		return {
			semaforo,
			reporte_markdown,
			competencia_considerada: relevantes,
			generado_en: new Date().toISOString()
		};
	} catch (err) {
		if (err instanceof ViabilidadError) throw err;
		const msg = err instanceof Error ? err.message : String(err);

		if (/API key not valid|invalid api key|401|403/i.test(msg)) {
			throw new ViabilidadError(
				`La API key fue rechazada por Google. Verifica GEMINI_API_KEY en .env. Detalle: ${msg}`,
				'INVALID_API_KEY'
			);
		}
		if (/429|quota|rate/i.test(msg)) {
			throw new ViabilidadError(
				`Límite de cuota o rate limit excedido. Detalle: ${msg}`,
				'RATE_LIMITED'
			);
		}
		throw new ViabilidadError(`Error del modelo: ${msg}`, 'UPSTREAM');
	}
}

/**
 * Respuesta sintética determinista para el modo SIMULATE_VIABILIDAD=true.
 * NO usa el LLM: calcula el semáforo por reglas sobre los mismos campos que
 * `competidoresRelevantes` y emite un reporte de plantilla. Útil para
 * demos, CI y desarrollo local sin GEMINI_API_KEY.
 */
function respuestaSintetica(
	negocio: NegocioAnalizar,
	establecimientos: EstablecimientoDenue[]
): AnalisisResultado {
	const giroLower = negocio.giro.toLowerCase();
	const ramoLower = negocio.ramo.toLowerCase();

	// Score de cada establecimiento respecto al negocio.
	const scored = establecimientos.map((e) => {
		const clase = e.clase_actividad.toLowerCase();
		const subsector = e.id_subsector_actividad;
		const ramo = e.id_rama_actividad;
		let s = 0;
		if (ramo && ramo === e.id_rama_actividad) s += 5;
		if (subsector && subsector === e.id_subsector_actividad) s += 3;
		if (giroLower === 'servicios' && subsector === '722') s += 1;
		if (giroLower === 'comercial' && subsector === '461') s += 1;
		if (ramoLower && clase.includes(ramoLower)) s += 2;
		for (const w of ramoLower.split(/\s+/).filter((w) => w.length > 3)) {
			if (clase.includes(w)) s += 1;
		}
		return { e, s };
	});

	const directos = scored.filter((x) => x.s >= 5).length;
	const cercanos = scored.filter((x) => x.s >= 3 && x.s < 5).length;
	const maxScore = scored.reduce((m, x) => (x.s > m ? x.s : m), 0);

	const relevantes = scored
		.sort((a, b) => b.s - a.s)
		.slice(0, 5)
		.map((x) => x.e);

	// Reglas deterministas:
	// 0 directos + 0 cercanos → verde
	// 1 directo  ó   2+ cercanos → amarillo
	// 2+ directos                 → rojo
	let color: SemaforoColor;
	let score: number;
	let razon: string;
	if (directos >= 2) {
		color = 'rojo';
		score = 28;
		razon = `Competencia directa alta: ${directos} establecimientos del mismo giro en la zona.`;
	} else if (directos === 1 || cercanos >= 2) {
		color = 'amarillo';
		score = 55;
		razon =
			directos === 1
				? `Competencia directa presente; requiere diferenciación clara.`
				: `Varios competidores indirectos en la zona.`;
	} else {
		color = 'verde';
		score = 78;
		razon = `Baja competencia directa en la zona para el giro ${negocio.giro}.`;
	}

	const alertas: string[] = [];
	if (directos > 0) {
		const nombresDirectos = scored
			.filter((x) => x.s >= 5)
			.slice(0, 3)
			.map((x) => x.e.nombre);
		alertas.push(`Competidores directos: ${nombresDirectos.join(', ')}.`);
	}
	if (cercanos > 0) {
		const nombresCercanos = scored
			.filter((x) => x.s >= 3 && x.s < 5)
			.slice(0, 3)
			.map((x) => x.e.nombre);
		alertas.push(`Competidores indirectos: ${nombresCercanos.join(', ')}.`);
	}
	if (maxScore === 0) {
		alertas.push(
			'El dataset DENUE no tiene registros del giro consultado; la evaluación es limitada.'
		);
	}

	const nombresRelevantes = relevantes.map((e) => `**${e.nombre}**`).join(', ');
	const reporte = `## Resumen de viabilidad

El negocio **${negocio.nombre}** (${negocio.giro} / ${negocio.ramo}) en **${negocio.zona}** obtiene un semáforo **${color.toUpperCase()}** con score ${score}/100 según las reglas sintéticas aplicadas al dataset DENUE adjunto (${establecimientos.length} establecimientos).

## Competencia considerada

Los establecimientos DENUE más relevantes para el giro consultado son: ${nombresRelevantes || 'sin coincidencias'}. Se identificaron **${directos}** competidores directos (misma rama SCIAN) y **${cercanos}** competidores indirectos (mismo subsector) en la zona.

## Recomendaciones

- Si la viabilidad es **verde**: hay espacio para entrar, pero valida la afluencia real de la zona con trabajo de campo.
- Si es **amarillo**: necesitas una propuesta de valor diferenciada (menú único, precio, servicio, ambiente).
- Si es **rojo**: considera reubicar o pivotar el giro; la zona ya está saturada para ${negocio.ramo}.

_Modo simulación activo: este reporte fue generado por reglas deterministas, no por IA. Configura GEMINI_API_KEY y desactiva SIMULATE_VIABILIDAD para usar Gemini._`;

	return {
		semaforo: { color, score, razon, alertas },
		reporte_markdown: reporte,
		competencia_considerada: relevantes,
		generado_en: new Date().toISOString()
	};
}
