// Tipos del módulo de análisis de viabilidad.
// No depende de la BD — los datos DENUE vienen de un JSON local
// (mientras el equipo de desarrollo termina la migración al mapa).

export interface EstablecimientoDenue {
	clee: string;
	id_establecimiento: string;
	nombre: string;
	razon_social: string;
	clase_actividad: string;
	estrato: string;
	tipo_vialidad: string;
	calle: string;
	numero_exterior: string;
	numero_interior: string;
	colonia: string;
	codigo_postal: string;
	localidad_municipio_entidad: string;
	telefono: string;
	correo: string;
	pagina_web: string;
	tipo_establecimiento: string;
	longitud: string;
	latitud: string;
	tipo_corredor_industrial: string;
	nombre_corredor_industrial: string;
	numero_local: string;
	ageb: string;
	manzana: string;
	edificio: string;
	id_clase_actividad: string;
	id_sector_actividad: string;
	id_subsector_actividad: string;
	id_rama_actividad: string;
}

export interface DenueDataset {
	fuente: string;
	descripcion: string;
	fecha_corte: string;
	cobertura: string;
	establecimientos: EstablecimientoDenue[];
}

/** Negocio del usuario que se está evaluando (input del análisis). */
export interface NegocioAnalizar {
	/** Nombre comercial del negocio. */
	nombre: string;
	/** Giro (industrial, comercial, servicios). */
	giro: 'industrial' | 'comercial' | 'servicios' | string;
	/** Ramo (alimentos, tecnología, etc.). */
	ramo: string;
	/** Zona/colonia prevista para abrir (texto libre). */
	zona: string;
}

/** Color del semáforo de viabilidad. */
export type SemaforoColor = 'verde' | 'amarillo' | 'rojo';

/** Resultado estructurado del semáforo. */
export interface SemaforoResultado {
	color: SemaforoColor;
	/** 0 (nada viable) – 100 (muy viable). */
	score: number;
	razon: string;
	alertas: string[];
}

/** Resultado completo del análisis: semáforo + reporte en markdown. */
export interface AnalisisResultado {
	semaforo: SemaforoResultado;
	reporte_markdown: string;
	/** Establecimientos DENUE que se consideraron (top relevantes). */
	competencia_considerada: EstablecimientoDenue[];
	/** Timestamp ISO del análisis. */
	generado_en: string;
}
