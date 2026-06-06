import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/db';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const correo = data.get('correo') as string;
		const password = data.get('password') as string;

		if (!correo || !password) {
			return fail(400, { error: 'Correo y contraseña son obligatorios.' });
		}

		const usuario = getDb()
			.prepare('SELECT id, password_hash FROM usuarios WHERE correo = ?')
			.get(correo) as { id: number; password_hash: string } | undefined;

		if (!usuario || usuario.password_hash !== password) {
			return fail(401, { error: 'Correo o contraseña incorrectos.' });
		}

		cookies.set('usuario_id', String(usuario.id), {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 60 * 8
		});

		redirect(303, '/demo');
	}
};
