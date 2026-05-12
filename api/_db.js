/**
 * Conexión compartida a PostgreSQL (Neon)
 * Usa un Pool para reutilizar conexiones en serverless.
 */
import pg from 'pg';
const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

/**
 * Crea la tabla team_members si no existe y la inicializa con los datos base.
 * Se llama automáticamente en el primer GET.
 */
export async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS team_members (
      id            SERIAL PRIMARY KEY,
      nombre        TEXT    NOT NULL,
      rol           TEXT    NOT NULL,
      seniority     TEXT    NOT NULL DEFAULT 'Senior',
      asignacion    INTEGER NOT NULL DEFAULT 100,
      costo_mensual NUMERIC NOT NULL DEFAULT 0,
      ingreso_mensual NUMERIC NOT NULL DEFAULT 0,
      area          TEXT    NOT NULL DEFAULT 'Backend',
      incluido      BOOLEAN NOT NULL DEFAULT TRUE,
      meses_en_proyecto INTEGER NOT NULL DEFAULT 22
    )
  `);
}
