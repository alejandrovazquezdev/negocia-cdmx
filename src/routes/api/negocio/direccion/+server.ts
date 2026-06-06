import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const usuario_id = cookies.get('usuario_id');
	if (!usuario_id) error(401, 'No autenticado');

	const body = await request.json().catch(() => null);
	const { cp, calle, colonia } = (body ?? {}) as Record<string, unknown>;

	if (typeof cp !== 'string' || typeof calle !== 'string' || typeof colonia !== 'string') {
		error(400, 'cp, calle y colonia son obligatorios');
	}
	if (!/^\d{5}$/.test(cp.trim())) error(400, 'El código postal debe tener 5 dígitos');

	const db = getDb();
	const row = db
		.prepare('SELECT id FROM negocios WHERE usuario_id = ? ORDER BY id DESC LIMIT 1')
		.get(Number(usuario_id)) as { id: number } | undefined;

	if (!row) error(404, 'Negocio no encontrado');

	db.prepare('UPDATE negocios SET cp = ?, calle = ?, colonia = ? WHERE id = ?').run(
		cp.trim(),
		calle.trim(),
		colonia.trim(),
		row.id
	);

	return json({ ok: true });
};
