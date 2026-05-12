/**
 * /api/ajustes-margen
 *
 * GET  → devuelve { extraCosts: [...], extraRevenues: [...] }
 * POST → guarda   { extraCosts: [...], extraRevenues: [...] }
 */
import 'dotenv/config';
import { getPool, ensureTable } from './_db.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

async function ensureAjustesTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ajustes_margen (
      id            SERIAL PRIMARY KEY,
      tipo          TEXT    NOT NULL CHECK (tipo IN ('cost','revenue')),
      descripcion   TEXT    NOT NULL DEFAULT '',
      monto         NUMERIC NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const pool   = getPool();
  const client = await pool.connect();

  try {
    await ensureAjustesTable(client);

    // ── GET ─────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { rows } = await client.query(
        'SELECT * FROM ajustes_margen ORDER BY id'
      );
      const extraCosts    = rows.filter(r => r.tipo === 'cost').map(r => ({
        id: r.id, descripcion: r.descripcion, monto: Number(r.monto),
      }));
      const extraRevenues = rows.filter(r => r.tipo === 'revenue').map(r => ({
        id: r.id, descripcion: r.descripcion, monto: Number(r.monto),
      }));
      return send(res, 200, { extraCosts, extraRevenues });
    }

    // ── POST — reemplaza todos los ajustes ──────────────────────────────────
    if (req.method === 'POST') {
      const { extraCosts = [], extraRevenues = [] } = await readBody(req);

      await client.query('DELETE FROM ajustes_margen');

      for (const c of extraCosts) {
        await client.query(
          'INSERT INTO ajustes_margen (tipo, descripcion, monto) VALUES ($1,$2,$3)',
          ['cost', c.descripcion || '', c.monto || 0]
        );
      }
      for (const r of extraRevenues) {
        await client.query(
          'INSERT INTO ajustes_margen (tipo, descripcion, monto) VALUES ($1,$2,$3)',
          ['revenue', r.descripcion || '', r.monto || 0]
        );
      }

      // Devolver los registros recién guardados con sus IDs reales
      const { rows } = await client.query(
        'SELECT * FROM ajustes_margen ORDER BY id'
      );
      const savedCosts    = rows.filter(r => r.tipo === 'cost').map(r => ({
        id: r.id, descripcion: r.descripcion, monto: Number(r.monto),
      }));
      const savedRevenues = rows.filter(r => r.tipo === 'revenue').map(r => ({
        id: r.id, descripcion: r.descripcion, monto: Number(r.monto),
      }));
      return send(res, 200, { extraCosts: savedCosts, extraRevenues: savedRevenues });
    }

    send(res, 405, { error: 'Método no permitido' });

  } catch (err) {
    console.error('[ajustes-margen]', err);
    send(res, 500, { error: err.message });
  } finally {
    client.release();
  }
}
