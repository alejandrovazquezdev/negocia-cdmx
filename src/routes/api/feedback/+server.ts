import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const data = await request.json().catch(() => null);
	if (!data) throw error(400, 'body inválido');

	const kind = data.kind === 'feature' ? 'feature' : data.kind === 'bug' ? 'bug' : null;
	const title = typeof data.title === 'string' ? data.title.trim() : '';
	const body = typeof data.body === 'string' ? data.body.trim() : '';
	const route = typeof data.route === 'string' ? data.route : '';

	if (!kind) throw error(400, 'kind requerido (bug|feature)');
	if (!title) throw error(400, 'título requerido');
	if (title.length > 200) throw error(400, 'título demasiado largo');

	const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null;
	const usuarioId = cookies.get('usuario_id') ?? null;

	const db = getDb();
	const result = db
		.prepare(
			`INSERT INTO feedback (kind, title, body, route, user_agent, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
		)
		.run(kind, title, body || null, route || '/', userAgent, usuarioId);

	return json({ ok: true, id: result.lastInsertRowid });
};

export const GET: RequestHandler = async () => {
	const db = getDb();
	const items = db.prepare(`SELECT * FROM feedback ORDER BY created_at DESC LIMIT 500`).all();
	return json({ items });
};

export const PATCH: RequestHandler = async ({ request }) => {
	const data = await request.json().catch(() => null);
	if (!data?.id) throw error(400, 'id requerido');

	const status =
		data.status === 'abierto' || data.status === 'en_progreso' || data.status === 'cerrado'
			? data.status
			: null;
	if (!status) throw error(400, 'status inválido');

	const db = getDb();
	db.prepare(`UPDATE feedback SET status = ?, resolved_at = ? WHERE id = ?`).run(
		status,
		status === 'cerrado' ? new Date().toISOString() : null,
		data.id
	);

	return json({ ok: true });
};
