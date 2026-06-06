// Tipos y cliente para la API DENUE del INEGI (Directorio Estadístico Nacional de Unidades Económicas)

export interface UnidadEconomica {
	Id: string;
	Nombre: string;
	Razon_social: string;
	Clase_actividad: string;
	Estrato: string;
	Tipo_vialidad: string;
	Calle: string;
	Num_Exterior: string;
	Num_Interior: string;
	Colonia: string;
	CP: string;
	Municipio: string;
	Entidad: string;
	Telefono: string;
	Correo_e: string;
	www: string;
	Tipo_Unidad: string;
	Longitud: string;
	Latitud: string;
	Total_personal: string;
}

export interface RespuestaDenue {
	lat: number;
	lng: number;
	negocios: UnidadEconomica[];
}

export type ParamsBusquedaDenue =
	| { keyword?: string; radio?: number; lat: number; lng: number }
	| { keyword?: string; radio?: number; cp: string }
	| { keyword?: string; radio?: number; direccion: string };

/** Llama al endpoint interno /api/denue (nunca expone el token al cliente). */
export async function buscarDenue(params: ParamsBusquedaDenue): Promise<RespuestaDenue> {
	const { keyword = 'comercio', radio = 500 } = params;
	const qs = new URLSearchParams({ keyword, radio: String(radio) });

	if ('cp' in params) {
		qs.set('cp', params.cp);
	} else if ('direccion' in params) {
		qs.set('direccion', params.direccion);
	} else {
		qs.set('lat', String(params.lat));
		qs.set('lng', String(params.lng));
	}

	const res = await fetch(`/api/denue?${qs}`);
	if (!res.ok) {
		const msg = await res.text().catch(() => String(res.status));
		throw new Error(`Error DENUE: ${msg}`);
	}
	return res.json() as Promise<RespuestaDenue>;
}
