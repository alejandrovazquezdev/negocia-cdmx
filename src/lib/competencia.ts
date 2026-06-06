import type { Giro } from './registro';

/**
 * Un competidor geolocalizado. Esta forma es deliberadamente neutral respecto
 * a la fuente: hoy la llenamos con datos mock, mañana puede venir de DENUE/INEGI,
 * del directorio de la CDMX o de nuestra propia base. Mantener estos campos
 * estables permite cambiar `obtenerCompetencia()` sin tocar el mapa.
 */
export interface Competidor {
	id: string;
	nombre: string;
	giro: Giro;
	ramo: string;
	lat: number;
	lon: number;
	/** Distancia aproximada al negocio del usuario, en km. Opcional. */
	distanciaKm?: number;
	/** Reseña promedio 0–5, si la fuente la provee. */
	calificacion?: number;
}

/** Centro de la CDMX (Zócalo) — punto de referencia por defecto del mapa. */
export const CDMX_CENTRO: [number, number] = [-99.1332, 19.4326];
export const CDMX_ZOOM = 11;

/**
 * Genera competidores mock alrededor de un punto. Determinista por `semilla`
 * para que el mapa no "salte" entre renders. Sustituible por una llamada real
 * (fetch/DB) que devuelva el mismo tipo `Competidor[]`.
 */
export function obtenerCompetencia(opts: {
	giro: Giro;
	ramo?: string | null;
	centro?: [number, number];
	cantidad?: number;
}): Competidor[] {
	const { giro, ramo, centro = CDMX_CENTRO, cantidad = 8 } = opts;
	const [lonBase, latBase] = centro;
	const ramoBase = ramo ?? 'General';

	const nombres = [
		'Local',
		'Punto',
		'Esquina',
		'Mercado',
		'Casa',
		'Plaza',
		'Rincón',
		'Estación',
		'Central',
		'Barrio'
	];

	return Array.from({ length: cantidad }, (_, i) => {
		// Dispersión pseudo-aleatoria pero estable (~±0.045° ≈ ±5 km).
		const ang = (i * 137.508 * Math.PI) / 180; // ángulo áureo → reparto uniforme
		const radio = 0.012 + ((i * 7) % 11) * 0.0035;
		const lon = lonBase + Math.cos(ang) * radio;
		const lat = latBase + Math.sin(ang) * radio;

		return {
			id: `mock-${i}`,
			nombre: `${nombres[i % nombres.length]} ${ramoBase}`,
			giro,
			ramo: ramoBase,
			lat,
			lon,
			distanciaKm: Math.round(radio * 111 * 10) / 10,
			calificacion: Math.round((3 + ((i * 3) % 5) * 0.4) * 10) / 10
		};
	});
}
