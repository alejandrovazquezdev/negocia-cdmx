import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const SYSTEM_PROMPT = `Eres un asesor jurídico-empresarial especializado en la Ciudad de México (CDMX). Generas guías paso a paso para que emprendedores registren su negocio de forma legal.

# Reglas
1. Basa la guía en los protocolos oficiales vigentes de la CDMX (2025).
2. Ordena los pasos cronológicamente por fase: "Pre-apertura" → "Constitución legal" → "Trámites CDMX" → "Apertura" → "Operación".
3. Genera entre 8 y 14 pasos según el giro del negocio.
4. Incluye trámites obligatorios (RFC, uso de suelo, licencia de funcionamiento) y específicos del giro.
5. Sé honesto con costos y tiempos; usa null si no tienes certeza.
6. Las advertencias son para requisitos críticos que los emprendedores suelen omitir.

# Dependencias CDMX
- SAT: sat.gob.mx
- SEDUVI: seduvi.cdmx.gob.mx
- Trámites CDMX / Alcaldías: tramites.cdmx.gob.mx
- SEDECO: sedeco.cdmx.gob.mx
- COFEPRIS: gob.mx/cofepris
- IMSS: imss.gob.mx
- Protección Civil CDMX: proteccioncivil.cdmx.gob.mx
- Secretaría de Gobierno CDMX: gobierno.cdmx.gob.mx

# Formato de salida (JSON estricto — sin texto fuera del objeto)
{
  "titulo": "Guía de registro para [tipo de negocio] en CDMX",
  "resumen": "Dos oraciones que describen para qué sirve esta guía.",
  "pasos": [
    {
      "fase": "Pre-apertura",
      "numero": 1,
      "titulo": "Título corto del paso (máx 60 caracteres)",
      "descripcion": "Qué hay que hacer exactamente. Texto plano, sin saltos de línea, máximo 220 caracteres.",
      "dependencia": "Nombre de la dependencia",
      "url": "sitio.gob.mx o null",
      "costo": "Gratuito / monto aproximado en MXN / null",
      "tiempo": "Tiempo estimado en días hábiles / null",
      "advertencia": "Advertencia crítica en texto plano (null si no hay)",
      "obligatorio": true
    }
  ]
}

CRÍTICO para que el JSON sea válido:
- Todos los strings son texto plano sin saltos de línea ni caracteres especiales.
- Los campos opcionales (url, costo, tiempo, advertencia) son null (sin comillas) cuando no aplican.
- No incluyas ningún texto, preámbulo ni bloque de código fuera del objeto JSON.`;

interface GuiaInput {
	giro?: string;
	ramo?: string;
	zona?: string;
}

export interface PasoGuia {
	fase: string;
	numero: number;
	titulo: string;
	descripcion: string;
	dependencia: string;
	url: string | null;
	costo: string | null;
	tiempo: string | null;
	advertencia: string | null;
	obligatorio: boolean;
}

export interface GuiaResponse {
	titulo: string;
	resumen: string;
	pasos: PasoGuia[];
}

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) {
		return json({ error: 'GEMINI_API_KEY no configurada.' }, { status: 503 });
	}

	let body: GuiaInput;
	try {
		body = (await request.json()) as GuiaInput;
	} catch {
		return json({ error: 'JSON de entrada inválido.' }, { status: 400 });
	}

	const giro = typeof body.giro === 'string' ? body.giro.trim() : 'comercio';
	const ramo = typeof body.ramo === 'string' ? body.ramo.trim() : '';
	const zona = typeof body.zona === 'string' ? body.zona.trim() : 'Ciudad de México';

	const userPrompt = `Genera la guía de registro legal para:
- Giro: ${giro}
- Ramo: ${ramo || 'No especificado'}
- Zona: ${zona}

Devuelve ÚNICAMENTE el objeto JSON con "titulo", "resumen" y "pasos". Nada más.`;

	try {
	// Schema forzado: Gemini garantiza JSON válido que cumple este shape.
	// Soluciona el bug intermitente donde el modelo devolvía texto malformado
	// y el cleanup por regex fallaba.
	const guiaSchema = {
		type: 'object',
		properties: {
			titulo: { type: 'string' },
			resumen: { type: 'string' },
			pasos: {
				type: 'array',
				minItems: 8,
				maxItems: 14,
				items: {
					type: 'object',
					properties: {
						fase: {
							type: 'string',
							enum: ['Pre-apertura', 'Constitución legal', 'Trámites CDMX', 'Apertura', 'Operación']
						},
						numero: { type: 'integer' },
						titulo: { type: 'string' },
						descripcion: { type: 'string' },
						dependencia: { type: 'string' },
						url: { type: 'string', nullable: true },
						costo: { type: 'string', nullable: true },
						tiempo: { type: 'string', nullable: true },
						advertencia: { type: 'string', nullable: true },
						obligatorio: { type: 'boolean' }
					},
					required: ['fase', 'numero', 'titulo', 'descripcion', 'dependencia', 'obligatorio']
				}
			}
		},
		required: ['titulo', 'resumen', 'pasos']
	} as const;

	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({
		model: env.GEMINI_MODEL || 'gemini-2.5-flash',
		systemInstruction: SYSTEM_PROMPT,
		generationConfig: {
			temperature: 0.2,
			topP: 0.85,
			maxOutputTokens: 4000,
			responseMimeType: 'application/json',
			responseSchema: guiaSchema
		}
	});

	// Retry defensivo: incluso con responseSchema, una corrida ocasional puede
	// traer un array vacío o un paso con campos faltantes. Reintentamos hasta
	// 2 veces antes de devolver error al usuario.
	let parsed: Record<string, unknown> | null = null;
	let lastErr: string | null = null;
	for (let intento = 1; intento <= 2; intento++) {
		try {
			const result = await model.generateContent(userPrompt);
			const raw = result.response.text();

			// Con responseSchema, Gemini normalmente devuelve JSON limpio.
			// Mantenemos una limpieza mínima por si llega con fences o texto extra.
			let cleaned = raw.trim();
			const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
			if (fence) cleaned = fence[1].trim();
			const objMatch = cleaned.match(/\{[\s\S]*\}/);
			if (objMatch) cleaned = objMatch[0];

			const candidate = JSON.parse(cleaned) as Record<string, unknown>;
			const pasos = candidate.pasos as unknown[] | undefined;
			if (Array.isArray(pasos) && pasos.length >= 8) {
				parsed = candidate;
				break;
			}
			lastErr = `intento ${intento}: ${pasos?.length ?? 0} pasos (mínimo 8)`;
		} catch (parseErr) {
			lastErr = `intento ${intento} parse: ${(parseErr as Error).message}`;
			console.error(`[guia-registro] ${lastErr}. Retrying…`);
		}
	}

	if (!parsed) {
		console.error(`[guia-registro] All retries failed. Last: ${lastErr}`);
		return json(
			{
				error:
					'No pudimos generar la guía completa. El servicio de IA está sobrecargado — intenta de nuevo en unos segundos.'
			},
			{ status: 502 }
		);
	}

		// Normalizar cada paso para garantizar tipos correctos.
		const pasos: PasoGuia[] = (parsed.pasos as Record<string, unknown>[]).map((paso, i) => ({
			fase: typeof paso.fase === 'string' ? paso.fase : 'General',
			numero: typeof paso.numero === 'number' ? paso.numero : i + 1,
			titulo: typeof paso.titulo === 'string' ? paso.titulo : `Paso ${i + 1}`,
			descripcion: typeof paso.descripcion === 'string' ? paso.descripcion : '',
			dependencia: typeof paso.dependencia === 'string' ? paso.dependencia : '',
			url: typeof paso.url === 'string' ? paso.url : null,
			costo: typeof paso.costo === 'string' ? paso.costo : null,
			tiempo: typeof paso.tiempo === 'string' ? paso.tiempo : null,
			advertencia: typeof paso.advertencia === 'string' ? paso.advertencia : null,
			obligatorio: paso.obligatorio !== false
		}));

		const respuesta: GuiaResponse = {
			titulo: typeof parsed.titulo === 'string' ? parsed.titulo : 'Guía de registro empresarial CDMX',
			resumen: typeof parsed.resumen === 'string' ? parsed.resumen : '',
			pasos
		};

		return json(respuesta);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error('[guia-registro] error:', msg);
		if (/API key not valid|401|403/i.test(msg)) {
			return json({ error: 'API key de Gemini inválida o no autorizada.' }, { status: 503 });
		}
		if (/429|quota|rate/i.test(msg)) {
			return json({ error: 'Límite de cuota excedido. Intenta en unos minutos.' }, { status: 429 });
		}
		return json({ error: `Error al generar la guía: ${msg}` }, { status: 500 });
	}
};
