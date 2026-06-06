// Endpoint de logout. El botón del header hace POST aquí como form action
// (no fetch), para que la redirect(303) la siga el browser y la cookie
// se borre en la misma response. Si alguien llega por GET a /logout, lo
// mandamos al inicio sin error 405.

import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete('usuario_id', { path: '/' });
		redirect(303, '/iniciar-sesion');
	}
};
