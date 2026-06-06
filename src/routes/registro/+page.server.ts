import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/db';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();

		const nombre = data.get('nombre') as string;
		const apellido_pat = data.get('apellido_pat') as string;
		const apellido_mat = (data.get('apellido_mat') as string) || null;
		const telefono = data.get('telefono') as string;
		const correo = data.get('correo') as string;
		const password = data.get('password') as string;

		const nombre_negocio = data.get('nombre_negocio') as string;
		const tiene_razon_social = data.get('tiene_razon_social') === 'true' ? 1 : 0;
		const razon_social = (data.get('razon_social') as string) || null;
		const rfc = (data.get('rfc') as string) || null;
		const giro = data.get('giro') as string;
		const ramo = data.get('ramo') as string;

		if (
			!nombre ||
			!apellido_pat ||
			!telefono ||
			!correo ||
			!password ||
			!nombre_negocio ||
			!giro ||
			!ramo
		) {
			return fail(400, { error: 'Faltan campos obligatorios.' });
		}

		const db = getDb();
		const existente = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(correo);
		if (existente) {
			return fail(400, { error: 'Ya existe una cuenta con ese correo.' });
		}

		// En hackathon: guardamos password en texto plano — reemplazar por bcrypt en producción
		const usuario = db
			.prepare(
				`INSERT INTO usuarios (nombre, apellido_pat, apellido_mat, telefono, correo, password_hash)
         VALUES (?, ?, ?, ?, ?, ?)`
			)
			.run(nombre, apellido_pat, apellido_mat, telefono, correo, password);

		db.prepare(
			`INSERT INTO negocios (usuario_id, nombre, tiene_razon_social, razon_social, rfc, giro, ramo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
		).run(
			usuario.lastInsertRowid,
			nombre_negocio,
			tiene_razon_social,
			razon_social,
			rfc,
			giro,
			ramo
		);

		cookies.set('usuario_id', String(usuario.lastInsertRowid), {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 60 * 8
		});

		redirect(303, '/demo');
	}
};
