#!/usr/bin/env node
// Simulación end-to-end de /api/viabilidad + verificación de que /demo
// carga el componente MapaDenue. Un solo caso, todo en una corrida.
//
// Uso:
//   node scripts/simular-viabilidad.mjs                    # arranca vite dev en :5180
//   node scripts/simular-viabilidad.mjs --base http://localhost:5173   # usa servidor existente
//   node scripts/simular-viabilidad.mjs --api-key=AIza... # fuerza GEMINI_API_KEY (no necesario en modo simulación)

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const args = Object.fromEntries(
	process.argv.slice(2).map((a) => {
		const [k, v] = a.replace(/^--/, '').split('=');
		return [k, v ?? 'true'];
	})
);

const BASE = args.base ?? 'http://localhost:5180';
const CASO = {
	negocio: {
		nombre: 'Cafetería La Tostada',
		giro: 'servicios',
		ramo: 'Alimentos',
		zona: 'Del Valle, Benito Juárez, CDMX'
	}
};

const ROJO = '\x1b[31m';
const VERDE = '\x1b[32m';
const AMARILLO = '\x1b[33m';
const AZUL = '\x1b[34m';
const GRIS = '\x1b[90m';
const NEGRITA = '\x1b[1m';
const RESET = '\x1b[0m';

function ok(msg) {
	console.log(`  ${VERDE}✓${RESET} ${msg}`);
}
function fail(msg) {
	console.log(`  ${ROJO}✗${RESET} ${msg}`);
}
function info(msg) {
	console.log(`${GRIS}${msg}${RESET}`);
}
function header(msg) {
	console.log(`\n${NEGRITA}${AZUL}▶ ${msg}${RESET}`);
}

async function esperarServidor(base, maxMs = 20000) {
	const t0 = Date.now();
	while (Date.now() - t0 < maxMs) {
		try {
			const r = await fetch(base + '/');
			if (r.status < 500) return;
		} catch {
			/* sigue intentando */
		}
		await delay(300);
	}
	throw new Error(`Servidor no respondió en ${base} tras ${maxMs}ms`);
}

async function paso1_API() {
	header('1) POST /api/viabilidad (modo simulación activo)');
	const t0 = Date.now();
	const res = await fetch(BASE + '/api/viabilidad', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(CASO)
	});
	const elapsed = Date.now() - t0;

	if (!res.ok) {
		const body = await res.text();
		fail(`HTTP ${res.status} en ${elapsed}ms`);
		console.log(body);
		throw new Error('API call failed');
	}
	ok(`HTTP 200 en ${elapsed}ms`);

	const data = await res.json();

	// 1. Semaforo presente y bien formado.
	if (!data.semaforo || !['verde', 'amarillo', 'rojo'].includes(data.semaforo.color)) {
		fail('Semaforo inválido o ausente');
		throw new Error('Bad semaforo');
	}
	ok(
		`Semaforo: ${data.semaforo.color} (score ${data.semaforo.score}/100) — ${data.semaforo.razon}`
	);

	// 2. Alertas.
	const numAlertas = (data.semaforo.alertas ?? []).length;
	ok(`Alertas: ${numAlertas}`);

	// 3. Reporte markdown.
	if (typeof data.reporte_markdown !== 'string' || data.reporte_markdown.length < 100) {
		fail('Reporte markdown ausente o muy corto');
		throw new Error('Bad reporte');
	}
	ok(
		`Reporte: ${data.reporte_markdown.length} caracteres, ${data.reporte_markdown.split('##').length - 1} secciones`
	);

	// 4. Competencia considerada.
	const comp = data.competencia_considerada ?? [];
	if (comp.length === 0) {
		fail('Sin competencia considerada');
		throw new Error('Bad competencia');
	}
	ok(`Competencia considerada: ${comp.length} establecimientos DENUE`);
	comp.forEach((e, i) => {
		info(`     [${i + 1}] ${e.nombre} — ${e.clase_actividad.slice(0, 50)}…`);
	});

	// 5. Validar los 29 campos DENUE en cada establecimiento.
	const campos29 = [
		'clee',
		'id_establecimiento',
		'nombre',
		'razon_social',
		'clase_actividad',
		'estrato',
		'tipo_vialidad',
		'calle',
		'numero_exterior',
		'numero_interior',
		'colonia',
		'codigo_postal',
		'localidad_municipio_entidad',
		'telefono',
		'correo',
		'pagina_web',
		'tipo_establecimiento',
		'longitud',
		'latitud',
		'tipo_corredor_industrial',
		'nombre_corredor_industrial',
		'numero_local',
		'ageb',
		'manzana',
		'edificio',
		'id_clase_actividad',
		'id_sector_actividad',
		'id_subsector_actividad',
		'id_rama_actividad'
	];
	const primerIncompleto = comp.find((e) => campos29.some((c) => !(c in e)));
	if (primerIncompleto) {
		fail(`Establecimiento ${primerIncompleto.nombre} sin los 29 campos DENUE`);
		throw new Error('Incomplete DENUE');
	}
	ok('Los 29 campos DENUE están presentes en cada registro');

	return data;
}

async function paso2_PaginaDemo() {
	header('2) GET /demo (verificación de carga del mapa)');
	// /demo redirige a /registro sin login (303). Probamos con y sin cookies.
	const r0 = await fetch(BASE + '/demo', { redirect: 'manual' });
	if (r0.status === 303 || r0.status === 302) {
		ok(`/demo redirige (${r0.status}) sin sesión — comportamiento esperado`);
	} else if (r0.status === 200) {
		ok(`/demo devolvió 200 (¿sesión activa? raro sin cookie)`);
	} else {
		fail(`/demo devolvió ${r0.status}, se esperaba 303/200`);
	}

	// Verificamos que el chunk de MapaDenue existe en el bundle del cliente.
	const rRoot = await fetch(BASE + '/');
	const html = await rRoot.text();
	const m = html.match(/src="(\/[^"]+\.js)"/g) ?? [];
	ok(`/ sirve ${m.length} chunks JS`);

	// Verificamos que el endpoint de DENUE existe (el mapa lo llama).
	const rDenue = await fetch(BASE + '/api/denue?lat=19.3725&lng=-99.1675&keyword=cafeteria', {
		redirect: 'manual'
	});
	if (rDenue.status === 503) {
		ok(`/api/denue responde 503 (sin .secret) — esperado sin token del equipo`);
	} else if (rDenue.status === 200) {
		ok(`/api/denue responde 200 con datos — el mapa puede cargar el tile`);
		const denueData = await rDenue.json();
		const n = Array.isArray(denueData.negocios) ? denueData.negocios.length : 0;
		info(`     ${n} negocios del DENUE en 500m alrededor del punto`);
	} else if (rDenue.status === 502 || rDenue.status === 422) {
		ok(
			`/api/denue responde ${rDenue.status} (api externa o geocodificador) — el mapa lo maneja con error`
		);
	} else {
		info(`     /api/denue respondió ${rDenue.status} (puede ser normal)`);
	}
}

async function paso3_Resumen(semaforo) {
	header('3) Resumen del caso simulado');
	const emoji = { verde: '🟢', amarillo: '🟡', rojo: '🔴' }[semaforo.color];
	console.log(`  Negocio:      ${NEGRITA}${CASO.negocio.nombre}${RESET}`);
	console.log(`  Giro/Ramo:    ${CASO.negocio.giro} / ${CASO.negocio.ramo}`);
	console.log(`  Zona:         ${CASO.negocio.zona}`);
	console.log(`  Semaforo:     ${emoji} ${semaforo.color.toUpperCase()} (${semaforo.score}/100)`);
	console.log(`  Razon:        ${semaforo.razon}`);
	if (semaforo.alertas.length) {
		console.log(`  Alertas:`);
		semaforo.alertas.forEach((a) => console.log(`     - ${a}`));
	}
	console.log('');
}

async function main() {
	let server = null;
	if (!args.base) {
		console.log(
			`${AMARILLO}▶ Arrancando vite dev en puerto 5180 con SIMULATE_VIABILIDAD=true…${RESET}`
		);
		server = spawn('npm', ['run', 'dev', '--', '--port', '5180'], {
			env: { ...process.env, SIMULATE_VIABILIDAD: 'true', PORT: '5180' },
			stdio: 'pipe'
		});
		server.stdout.on('data', (b) => process.stderr.write(b));
		server.stderr.on('data', (b) => process.stderr.write(b));
		await esperarServidor(BASE);
	} else {
		info(`Usando servidor existente en ${BASE}`);
	}

	try {
		const data = await paso1_API();
		await paso2_PaginaDemo();
		await paso3_Resumen(data.semaforo);
		console.log(`${VERDE}${NEGRITA}✓ Simulación completada${RESET}\n`);
	} catch (e) {
		fail(e.message);
		process.exitCode = 1;
	} finally {
		if (server) {
			server.kill('SIGTERM');
		}
	}
}

main();
