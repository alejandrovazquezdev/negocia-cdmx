import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export interface ResultadoGeocodificacion {
	lat: number;
	lng: number;
	etiqueta: string;
}

// Proxy a Nominatim (OpenStreetMap) — restringe búsquedas a México.
export const GET: RequestHandler = async ({ url }) => {
	const consulta = url.searchParams.get('q');
	if (!consulta?.trim()) error(400, 'Se requiere el parámetro q (dirección o CP)');

	const qs = new URLSearchParams({
		q: `${consulta}, Ciudad de México, México`,
		format: 'json',
		limit: '1',
		countrycodes: 'mx',
		addressdetails: '0'
	});

	let respuesta: Response;
	try {
		respuesta = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, {
			headers: {
				// Nominatim requiere un User-Agent con nombre de app y contacto.
				'User-Agent': 'NegociaCDMX/1.0 (service@icarus.mx)',
				'Accept-Language': 'es'
			}
		});
	} catch {
		error(502, 'No se pudo conectar con el servicio de geocodificación');
	}

	if (!respuesta.ok) error(502, `Geocodificador respondió con ${respuesta.status}`);

	const datos = (await respuesta.json()) as Array<{
		lat: string;
		lon: string;
		display_name: string;
	}>;
	if (!datos.length) error(404, 'No se encontró la dirección o código postal indicado');

	const [primero] = datos;
	return json({
		lat: parseFloat(primero.lat),
		lng: parseFloat(primero.lon),
		etiqueta: primero.display_name
	} satisfies ResultadoGeocodificacion);
};
