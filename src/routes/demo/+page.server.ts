import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => {
	const usuario_id = cookies.get('usuario_id');
	if (!usuario_id) redirect(303, '/registro');

	const usuario = db
		.prepare('SELECT * FROM usuarios WHERE id = ?')
		.get(Number(usuario_id)) as Record<string, unknown> | undefined;

	const negocio = db
		.prepare('SELECT * FROM negocios WHERE usuario_id = ? ORDER BY id DESC LIMIT 1')
		.get(Number(usuario_id)) as Record<string, unknown> | undefined;

	if (!usuario) redirect(303, '/registro');

	return { usuario, negocio };
};
