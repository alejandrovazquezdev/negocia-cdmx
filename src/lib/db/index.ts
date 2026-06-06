import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

const DB_PATH = resolve(process.env.DATABASE_PATH ?? 'data/negocia.db');
const MIGRATION_PATH = resolve('src/lib/db/migrations/001_init.sql');

let _db: Database.Database | undefined;

export function getDb() {
	if (_db) return _db;
	mkdirSync(dirname(DB_PATH), { recursive: true });
	_db = new Database(DB_PATH);
	_db.exec(readFileSync(MIGRATION_PATH, 'utf-8'));
	// Columnas de dirección agregadas después de la migración inicial.
	for (const col of ['cp', 'calle', 'colonia']) {
		try {
			_db.exec(`ALTER TABLE negocios ADD COLUMN ${col} TEXT`);
		} catch {
			/* ya existe */
		}
	}
	return _db;
}
