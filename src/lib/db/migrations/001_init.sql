-- NegociaCDMX — migración inicial
-- SQLite · hackathon edition

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Usuarios (dueños de negocio + credenciales)
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  apellido_pat  TEXT NOT NULL,
  apellido_mat  TEXT,
  telefono      TEXT NOT NULL,
  correo        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Negocios (uno por usuario por ahora)
CREATE TABLE IF NOT EXISTS negocios (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id         INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre             TEXT NOT NULL,
  tiene_razon_social INTEGER DEFAULT 0,   -- 0 = false, 1 = true
  razon_social       TEXT,
  rfc                TEXT,
  giro               TEXT CHECK (giro IN ('industrial', 'comercial', 'servicios')),
  ramo               TEXT,
  created_at         TEXT DEFAULT (datetime('now'))
);

-- Análisis de viabilidad por negocio y zona
CREATE TABLE IF NOT EXISTS analisis (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  negocio_id        INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  alcaldia          TEXT,
  colonia           TEXT,
  score             INTEGER CHECK (score BETWEEN 0 AND 100),
  nivel_competencia TEXT CHECK (nivel_competencia IN ('bajo', 'medio', 'alto')),
  nivel_afluencia   TEXT CHECK (nivel_afluencia IN ('bajo', 'medio', 'alto')),
  notas             TEXT,
  created_at        TEXT DEFAULT (datetime('now'))
);

-- Trámites requeridos según giro/ramo
CREATE TABLE IF NOT EXISTS tramites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  giro        TEXT,   -- NULL = aplica a todos
  ramo        TEXT,   -- NULL = aplica a todos
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  institucion TEXT,
  orden       INTEGER,
  url_ref     TEXT
);

-- Programas de emprendimiento CDMX
CREATE TABLE IF NOT EXISTS programas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  url_convoc  TEXT,
  fecha_inicio TEXT,
  fecha_fin    TEXT
);
