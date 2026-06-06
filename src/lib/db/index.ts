import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

const DB_PATH = resolve('data/negocia.db');
const MIGRATION_PATH = resolve('src/lib/db/migrations/001_init.sql');

function createDb() {
	// Asegurar que el directorio existe antes de abrir la DB (importante en CI/builds limpios).
	mkdirSync(dirname(DB_PATH), { recursive: true });
	const db = new Database(DB_PATH);
	const migration = readFileSync(MIGRATION_PATH, 'utf-8');
	db.exec(migration);
	return db;
}

export const db = createDb();
