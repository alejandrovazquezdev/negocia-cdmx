import { readFileSync } from 'fs';
import { resolve } from 'path';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function leerToken(): string {
	const contenido = readFileSync(resolve('.secret'), 'utf-8');
	for (const linea of contenido.split('\n')) {
		const idx = linea.indexOf('=');
		if (idx === -1) continue;
		const clave = linea.slice(0, idx).trim();
		const valor = linea.slice(idx + 1).trim();
		if (clave === 'INEGI_DENUE_TOKEN') return valor;
	}
	throw new Error('INEGI_DENUE_TOKEN no encontrado en .secret');
}

const DENUE_BASE = 'https://www.inegi.org.mx/app/api/denue/v1/consulta/Buscar';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

async function geocodificar(consulta: string): Promise<{ lat: number; lng: number }> {
	const qs = new URLSearchParams({
		q: `${consulta}, Ciudad de México, México`,
		format: 'json',
		limit: '1',
		countrycodes: 'mx',
		addressdetails: '0'
	});
	const res = await fetch(`${NOMINATIM}?${qs}`, {
		headers: { 'User-Agent': 'NegociaCDMX/1.0 (service@icarus.mx)', 'Accept-Language': 'es' }
	});
	if (!res.ok) throw new Error(`Geocodificador: ${res.status}`);
	const datos = (await res.json()) as Array<{ lat: string; lon: string }>;
	if (!datos.length) throw new Error('Sin resultados de geocodificación');
	return { lat: parseFloat(datos[0].lat), lng: parseFloat(datos[0].lon) };
}

export const GET: RequestHandler = async ({ url }) => {
	const keyword = url.searchParams.get('keyword') ?? 'comercio';
	const radio = url.searchParams.get('radio') ?? '500';

	// Token cargado perezosamente para que el build no falle si el archivo
	// .secret aún no está en el entorno (es trabajo del equipo de datos).
	let TOKEN: string;
	try {
		TOKEN = leerToken();
	} catch (e) {
		error(
			503,
			`Servicio DENUE no configurado: ${(e as Error).message}. Crea un archivo .secret con INEGI_DENUE_TOKEN=...`
		);
	}

	let lat: number, lng: number;

	const cp = url.searchParams.get('cp');
	const direccion = url.searchParams.get('direccion');

	if (cp || direccion) {
		// Geocodificar CP o dirección libre antes de consultar DENUE.
		const consulta = cp ?? direccion!;
		try {
			({ lat, lng } = await geocodificar(consulta));
		} catch (e) {
			error(422, `No se pudo geocodificar "${consulta}": ${(e as Error).message}`);
		}
	} else {
		const latParam = url.searchParams.get('lat');
		const lngParam = url.searchParams.get('lng');
		if (!latParam || !lngParam) error(400, 'Se requieren lat+lng, cp, o direccion');
		lat = parseFloat(latParam);
		lng = parseFloat(lngParam);
	}

	const apiUrl = `${DENUE_BASE}/${encodeURIComponent(keyword)}/${lat},${lng}/${radio}/${TOKEN}`;

	let respuesta: Response;
	try {
		respuesta = await fetch(apiUrl);
	} catch {
		error(502, 'No se pudo conectar con la API DENUE del INEGI');
	}

	if (!respuesta.ok) error(502, `API DENUE respondió con ${respuesta.status}`);

	const datos = await respuesta.json();
	return json({ lat, lng, negocios: datos });
};
