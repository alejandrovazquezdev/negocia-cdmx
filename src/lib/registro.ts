// Modelo de datos y validaciones del módulo de registro (Reto 2 — Viabilidad de negocios CDMX)

export type Giro = 'industrial' | 'comercial' | 'servicios';

export interface Dueno {
	nombre: string;
	apellidoPaterno: string;
	/** Opcional. En México, omitir el materno es legal y común. */
	apellidoMaterno?: string;
	telefono: string;
	correo: string;
}

export interface Negocio {
	nombre: string;
	tieneRazonSocial: boolean;
	/** Solo aplica si tieneRazonSocial === true */
	razonSocial: string;
	rfc: string;
	giro: Giro | '';
	ramo: string;
}

export interface Registro {
	dueno: Dueno;
	negocio: Negocio;
}

// --- Constantes de dominio ---

export const GIROS: { value: Giro; label: string }[] = [
	{ value: 'industrial', label: 'Industrial' },
	{ value: 'comercial', label: 'Comercial' },
	{ value: 'servicios', label: 'Servicios' }
];

/** Lista plana conservada para compatibilidad; el form usa `RAMOS_POR_GIRO`. */
export const RAMOS: string[] = [
	'Alimentos',
	'Tecnología',
	'Salud',
	'Educación',
	'Moda y textil',
	'Construcción',
	'Turismo',
	'Entretenimiento',
	'Manufactura',
	'Otro'
];

/** Jerarquía Giro → Ramos. Una giro solo ofrece los ramos que le aplican. */
export const RAMOS_POR_GIRO: Record<Giro, readonly string[]> = {
	industrial: ['Alimentos', 'Construcción', 'Manufactura', 'Tecnología', 'Otro'],
	comercial: ['Alimentos', 'Moda y textil', 'Tecnología', 'Entretenimiento', 'Otro'],
	servicios: ['Educación', 'Salud', 'Turismo', 'Tecnología', 'Entretenimiento', 'Otro']
};

export function nuevoRegistro(): Registro {
	return {
		dueno: {
			nombre: '',
			apellidoPaterno: '',
			telefono: '',
			correo: ''
		},
		negocio: {
			nombre: '',
			tieneRazonSocial: false,
			razonSocial: '',
			rfc: '',
			giro: '',
			ramo: ''
		}
	};
}

// --- Validación ---

export interface ValidationError {
	/** Clave del campo para que el form pueda asociar el error al input concreto. */
	field: string;
	message: string;
}

const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_TELEFONO = /^\d{10}$/;
// RFC persona moral (12 chars) o física (13 chars).
// Estructura: 3-4 letras (incluye Ñ y & para casos legacy) + 6 dígitos (fecha AAMMDD) + 3 alfanuméricos (homoclave).
// No valida la codificación de la fecha ni el dígito verificador — eso requiere el algoritmo oficial del SAT.
const RE_RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;

function e(field: string, message: string): ValidationError {
	return { field, message };
}

export function validarDueno(d: Dueno): ValidationError[] {
	const errores: ValidationError[] = [];
	if (!d.nombre.trim()) errores.push(e('nombre', 'El nombre es obligatorio.'));
	if (!d.apellidoPaterno.trim())
		errores.push(e('apellidoPaterno', 'El apellido paterno es obligatorio.'));
	if (!RE_TELEFONO.test(d.telefono.trim()))
		errores.push(e('telefono', 'El teléfono debe tener 10 dígitos numéricos.'));
	if (!RE_CORREO.test(d.correo.trim())) errores.push(e('correo', 'El correo no es válido.'));
	return errores;
}

export function validarNegocio(n: Negocio): ValidationError[] {
	const errores: ValidationError[] = [];
	if (!n.nombre.trim()) errores.push(e('nombre', 'El nombre del negocio es obligatorio.'));
	if (n.tieneRazonSocial) {
		if (!n.razonSocial.trim()) errores.push(e('razonSocial', 'La razón social es obligatoria.'));
		if (!RE_RFC.test(n.rfc.trim()))
			errores.push(e('rfc', 'El RFC no tiene un formato válido (12 o 13 caracteres).'));
	}
	if (!n.giro) errores.push(e('giro', 'Selecciona un giro.'));
	if (!n.ramo) errores.push(e('ramo', 'Selecciona un ramo.'));
	return errores;
}

/**
 * Tras pasar el regex, retorna un warning que el form debe mostrar al usuario.
 * El regex no valida la codificación de fecha ni el dígito verificador del RFC.
 * TODO: cuando exista backend, conectar con la API de validación del SAT o implementar
 * el algoritmo de dígito verificador (Anexo II de la Resolución Miscelánea Fiscal).
 */
export function advertenciaRFC(rfc: string): string | null {
	const limpio = rfc.trim();
	if (!limpio) return null;
	if (!RE_RFC.test(limpio)) return null; // la validación dura ya lo cubre
	return 'Verifica tu RFC con el SAT. Esta validación solo confirma la estructura.';
}

/** Encuentra el primer error de un campo. Helper para el form. */
export function errorDe(errores: ValidationError[], field: string): string | undefined {
	return errores.find((er) => er.field === field)?.message;
}
