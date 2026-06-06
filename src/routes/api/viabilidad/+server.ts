// Endpoint POST /api/viabilidad — analiza la viabilidad del negocio del usuario
// contra el dataset DENUE local (mock). Llama a Gemini y devuelve semáforo + reporte.

import { json, type RequestHandler } from '@sveltejs/kit';
import { analizarViabilidad, ViabilidadError } from '$lib/viabilidad/analyzer';
import type { NegocioAnalizar } from '$lib/viabilidad/types';

interface BodyIn {
	negocio: Partial<NegocioAnalizar>;
}

const MAX_BODY_BYTES = 4_000;

function validate(body: unknown): NegocioAnalizar | { error: string } {
	if (!body || typeof body !== 'object') return { error: 'Body inválido.' };
	const b = body as BodyIn;
	const n = b.negocio;
	if (!n || typeof n !== 'object') return { error: 'Falta el campo "negocio".' };

	const nombre = typeof n.nombre === 'string' ? n.nombre.trim() : '';
	const giro = typeof n.giro === 'string' ? n.giro.trim() : '';
	const ramo = typeof n.ramo === 'string' ? n.ramo.trim() : '';
	const zona = typeof n.zona === 'string' ? n.zona.trim() : '';

	if (!nombre) return { error: 'El nombre del negocio es obligatorio.' };
	if (nombre.length > 120) return { error: 'El nombre del negocio es demasiado largo.' };
	if (!giro) return { error: 'El giro es obligatorio.' };
	if (!ramo) return { error: 'El ramo es obligatorio.' };
	if (!zona) return { error: 'La zona es obligatoria.' };
	if (zona.length > 200) return { error: 'La zona es demasiado larga.' };

	return { nombre, giro, ramo, zona };
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const clientIp = getClientAddress();
	console.log(`[viabilidad] request from ${clientIp}`);

	// 1. Tamaño del body (defensa rápida contra payloads absurdos).
	const contentLength = Number(request.headers.get('content-length') ?? '0');
	if (contentLength > MAX_BODY_BYTES) {
		return json({ error: 'Body demasiado grande.' }, { status: 413 });
	}

	// 2. Parse + validación.
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido.' }, { status: 400 });
	}

	const result = validate(body);
	if ('error' in result) {
		return json({ error: result.error }, { status: 400 });
	}

	// 3. Análisis con IA.
	try {
		const analisis = await analizarViabilidad(result);
		return json(analisis);
	} catch (err) {
		if (err instanceof ViabilidadError) {
			const status =
				err.code === 'NO_API_KEY' || err.code === 'INVALID_API_KEY'
					? 503
					: err.code === 'RATE_LIMITED'
						? 429
						: err.code === 'INVALID_OUTPUT'
							? 502
							: 502;
			console.error(`[viabilidad] ${err.code}: ${err.message}`);
			return json({ error: err.message, code: err.code }, { status });
		}
		const msg = err instanceof Error ? err.message : 'Error desconocido';
		console.error(`[viabilidad] unexpected: ${msg}`);
		return json({ error: 'Error interno al generar el análisis.' }, { status: 500 });
	}
};
