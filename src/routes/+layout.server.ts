// Carga a nivel layout: expone la sesión actual a TODAS las páginas,
// para que el header global pueda mostrar el botón "Cerrar sesión".
// La página específica puede hacer su propia query (ej. /demo trae el
// negocio); aquí solo lo mínimo para identificar al usuario.

import { getDb } from '$lib/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
	const id = cookies.get('usuario_id');
	if (!id) return { loggedIn: false, usuario: null };

	const u = getDb()
		.prepare('SELECT id, nombre, apellido_pat FROM usuarios WHERE id = ?')
		.get(Number(id)) as { id: number; nombre: string; apellido_pat: string } | undefined;

	if (!u) return { loggedIn: false, usuario: null };
	return { loggedIn: true, usuario: u };
};
