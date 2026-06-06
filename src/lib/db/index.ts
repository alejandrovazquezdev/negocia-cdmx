import Database from 'better-sqlite3';
import { mkdirSync, readdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

const DB_PATH = resolve(process.env.DATABASE_PATH ?? 'data/negocia.db');
const MIGRATIONS_DIR = resolve('src/lib/db/migrations');

let _db: Database.Database | undefined;

export function getDb() {
	if (_db) return _db;
	mkdirSync(dirname(DB_PATH), { recursive: true });
	_db = new Database(DB_PATH);

	// Ejecuta todas las migraciones en orden lexicográfico (001_, 002_, …).
	// Cada archivo es idempotente (IF NOT EXISTS / OR IGNORE) para que pueda
	// correr varias veces sin romper.
	const files = readdirSync(MIGRATIONS_DIR)
		.filter((f) => f.endsWith('.sql'))
		.sort();
	for (const f of files) {
		_db.exec(readFileSync(resolve(MIGRATIONS_DIR, f), 'utf-8'));
	}

	// Columnas de dirección agregadas después de la migración inicial
	// (compatibilidad con BDs creadas antes de 001_init.sql incluirlas).
	for (const col of ['cp', 'calle', 'colonia']) {
		try {
			_db.exec(`ALTER TABLE negocios ADD COLUMN ${col} TEXT`);
		} catch {
			/* ya existe */
		}
	}
	return _db;
}
