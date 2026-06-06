import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DB_PATH = resolve('data/negocia.db');
const MIGRATION_PATH = resolve('src/lib/db/migrations/001_init.sql');

function createDb() {
	const db = new Database(DB_PATH);
	const migration = readFileSync(MIGRATION_PATH, 'utf-8');
	db.exec(migration);
	return db;
}

export const db = createDb();
