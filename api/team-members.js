/**
 * /api/team-members
 *
 * GET    → lista todos los miembros
 * POST   → crea un miembro nuevo  (body: JSON)
 * PUT    → actualiza un miembro   (body: JSON con id)
 * DELETE → elimina un miembro     (?id=N)
 *
 * También acepta:
 *   POST /api/team-members?action=reset  → borra todo e inserta datos iniciales
 */
import 'dotenv/config';
import { getPool, ensureTable } from './_db.js';

// ── Datos iniciales (mismos que tenía teamDB.js) ─────────────────────────────
const INITIAL_DATA = [
  { nombre: 'Monica Restrepo',          rol: 'Delivery Manager',          seniority: 'Senior',   asignacion: 100, costoMensual: 8457,  ingresoMensual: 7000, area: 'Alineación',      incluido: true, mesesEnProyecto: 22 },
  { nombre: 'Daniela Urrego',           rol: 'Gerente de Proyecto',       seniority: 'Senior',   asignacion: 100, costoMensual: 3343,  ingresoMensual: 7000, area: 'Alineación',      incluido: true, mesesEnProyecto: 22 },
  { nombre: 'Valeria Salazar',          rol: 'Gerente de Proyecto 2',     seniority: 'Junior',   asignacion: 100, costoMensual: 2380,  ingresoMensual: 7000, area: 'Alineación',      incluido: true, mesesEnProyecto: 21 },
  { nombre: 'Valentina Villegas',       rol: 'Business Consultant',       seniority: 'Senior',   asignacion: 50,  costoMensual: 1953,  ingresoMensual: 4000, area: 'Alineación',      incluido: true, mesesEnProyecto: 1  },
  { nombre: 'Davi Ospino',              rol: 'Business Consultant',       seniority: 'Senior',   asignacion: 100, costoMensual: 3396,  ingresoMensual: 8000, area: 'Alineación',      incluido: true, mesesEnProyecto: 2  },
  { nombre: 'Jairo Duarte',             rol: 'Líder de Arquitectura',     seniority: 'Senior',   asignacion: 100, costoMensual: 6898,  ingresoMensual: 8500, area: 'Alineación',      incluido: true, mesesEnProyecto: 22 },
  { nombre: 'Kaylee Danae Paez',        rol: 'Ing. DevOps',               seniority: 'Senior',   asignacion: 100, costoMensual: 3637,  ingresoMensual: 6200, area: 'Alineación',      incluido: true, mesesEnProyecto: 22 },
  { nombre: 'Rommy Duarte',             rol: 'Líder Técnico Backend',     seniority: 'Máster',   asignacion: 100, costoMensual: 4402,  ingresoMensual: 7000, area: 'Alineación',      incluido: true, mesesEnProyecto: 1  },
  { nombre: 'Abraham Abner Vega',       rol: 'Líder Técnico Backend',     seniority: 'Máster',   asignacion: 100, costoMensual: 5405,  ingresoMensual: 7000, area: 'Alineación',      incluido: true, mesesEnProyecto: 21 },
  { nombre: 'Juan Carlos Suarez',       rol: 'Líder Técnico Frontend',    seniority: 'Máster',   asignacion: 100, costoMensual: 3812,  ingresoMensual: 7000, area: 'Alineación',      incluido: true, mesesEnProyecto: 19 },
  { nombre: 'Mauricio Acevedo',         rol: 'UX/UI Designer',            seniority: 'Senior',   asignacion: 100, costoMensual: 2507,  ingresoMensual: 5800, area: 'UX/UI',           incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Alvaro José Uribe',        rol: 'UX/UI Designer',            seniority: 'Senior',   asignacion: 100, costoMensual: 2480,  ingresoMensual: 5800, area: 'UX/UI',           incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Lina Maria Valencia',      rol: 'UX/UI Designer',            seniority: 'Senior',   asignacion: 100, costoMensual: 2958,  ingresoMensual: 5800, area: 'UX/UI',           incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Andres Useche',            rol: 'Arquitecto de Soluciones',  seniority: 'Senior',   asignacion: 100, costoMensual: 8147,  ingresoMensual: 8500, area: 'Arquitectura',    incluido: true, mesesEnProyecto: 12 },
  { nombre: 'Juan Sebastian Cardenas',  rol: 'Arquitecto Mobile',         seniority: 'Senior',   asignacion: 100, costoMensual: 5217,  ingresoMensual: 8500, area: 'Arquitectura',    incluido: true, mesesEnProyecto: 8  },
  { nombre: 'Jeisson Stiven Santacruz', rol: 'Arquitecto Mobile',         seniority: 'Senior',   asignacion: 100, costoMensual: 4378,  ingresoMensual: 8500, area: 'Arquitectura',    incluido: true, mesesEnProyecto: 7  },
  { nombre: 'Joel Dovale',              rol: 'Desarrollador Backend',     seniority: 'Senior',   asignacion: 100, costoMensual: 2285,  ingresoMensual: 6200, area: 'Backend',         incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Santiago Suaza',           rol: 'Desarrollador Backend',     seniority: 'Senior',   asignacion: 100, costoMensual: 3111,  ingresoMensual: 6200, area: 'Backend',         incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Kevin Ruda',               rol: 'Desarrollador Backend',     seniority: 'Senior',   asignacion: 100, costoMensual: 2306,  ingresoMensual: 6200, area: 'Backend',         incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Santiago Apraez',          rol: 'Desarrollador Backend',     seniority: 'Advanced', asignacion: 100, costoMensual: 3103,  ingresoMensual: 6200, area: 'Backend',         incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Daniel Mateo Guerra',      rol: 'Desarrollador Backend',     seniority: 'Advanced', asignacion: 100, costoMensual: 2033,  ingresoMensual: 6200, area: 'Backend',         incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Patricio Dante Torres',    rol: 'Backend Temporal',          seniority: 'Advanced', asignacion: 100, costoMensual: 1789,  ingresoMensual: 6200, area: 'Backend',         incluido: true, mesesEnProyecto: 2  },
  { nombre: 'Angie Hasbleidy Rivera',   rol: 'Desarrollador Frontend',    seniority: 'Senior',   asignacion: 100, costoMensual: 3035,  ingresoMensual: 6200, area: 'Frontend',        incluido: true, mesesEnProyecto: 12 },
  { nombre: 'Juan Sebastian Caceres',   rol: 'Desarrollador Frontend',    seniority: 'Advanced', asignacion: 100, costoMensual: 2607,  ingresoMensual: 6200, area: 'Frontend',        incluido: true, mesesEnProyecto: 12 },
  { nombre: 'Hildelbrando Rios',        rol: 'Desarrollador Frontend',    seniority: 'Senior',   asignacion: 100, costoMensual: 3924,  ingresoMensual: 6200, area: 'Frontend',        incluido: true, mesesEnProyecto: 12 },
  { nombre: 'René José Cardona',        rol: 'Desarrollador Frontend',    seniority: 'Senior',   asignacion: 100, costoMensual: 3346,  ingresoMensual: 6200, area: 'Frontend',        incluido: true, mesesEnProyecto: 12 },
  { nombre: 'Hugo Javier Padilla',      rol: 'Desarrollador Frontend',    seniority: 'Advanced', asignacion: 100, costoMensual: 1383,  ingresoMensual: 6200, area: 'Frontend',        incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Julio Rodriguez',          rol: 'Desarrollador Frontend',    seniority: 'Senior',   asignacion: 100, costoMensual: 3625,  ingresoMensual: 6200, area: 'Frontend',        incluido: true, mesesEnProyecto: 4  },
  { nombre: 'David Henao Mejía',        rol: 'QA Engineer',               seniority: 'Senior',   asignacion: 100, costoMensual: 2278,  ingresoMensual: 5100, area: 'QA',              incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Juan Felipe Henao',        rol: 'QA Engineer',               seniority: 'Senior',   asignacion: 100, costoMensual: 1991,  ingresoMensual: 5100, area: 'QA',              incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Christian Ortega',         rol: 'QA Engineer',               seniority: 'Advanced', asignacion: 100, costoMensual: 1986,  ingresoMensual: 5100, area: 'QA',              incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Dehiler Sepulveda',        rol: 'QA Temporal',               seniority: 'Advanced', asignacion: 100, costoMensual: 1927,  ingresoMensual: 5100, area: 'QA',              incluido: true, mesesEnProyecto: 5  },
  { nombre: 'BO Backend 1',             rol: 'Desarrollador Backend BO',  seniority: 'Senior',   asignacion: 100, costoMensual: 3111,  ingresoMensual: 6200, area: 'Backoffice',      incluido: true, mesesEnProyecto: 7  },
  { nombre: 'BO Backend 2',             rol: 'Desarrollador Backend BO',  seniority: 'Senior',   asignacion: 100, costoMensual: 3111,  ingresoMensual: 6200, area: 'Backoffice',      incluido: true, mesesEnProyecto: 7  },
  { nombre: 'BO Frontend 1',            rol: 'Desarrollador Frontend BO', seniority: 'Senior',   asignacion: 100, costoMensual: 3924,  ingresoMensual: 6200, area: 'Backoffice',      incluido: true, mesesEnProyecto: 12 },
  { nombre: 'BO Frontend 4',            rol: 'Desarrollador Frontend BO', seniority: 'Senior',   asignacion: 100, costoMensual: 3924,  ingresoMensual: 6200, area: 'Backoffice',      incluido: true, mesesEnProyecto: 7  },
  { nombre: 'BO QA 1',                  rol: 'QA Engineer BO',            seniority: 'Advanced', asignacion: 100, costoMensual: 2278,  ingresoMensual: 5100, area: 'Backoffice',      incluido: true, mesesEnProyecto: 12 },
  { nombre: 'GP3 PJ (Valeria ref)',     rol: 'Gerente de Proyecto PJ',    seniority: 'Senior',   asignacion: 50,  costoMensual: 1190,  ingresoMensual: 3500, area: 'Alineación PJ',   incluido: true, mesesEnProyecto: 14 },
  { nombre: 'UX/UI PJ 1 (Mauricio)',   rol: 'UX/UI Designer PJ',         seniority: 'Senior',   asignacion: 100, costoMensual: 2507,  ingresoMensual: 5800, area: 'UX/UI PJ',        incluido: true, mesesEnProyecto: 9  },
  { nombre: 'UX/UI PJ 2 (Alvaro)',     rol: 'UX/UI Designer PJ',         seniority: 'Senior',   asignacion: 100, costoMensual: 2480,  ingresoMensual: 5800, area: 'UX/UI PJ',        incluido: true, mesesEnProyecto: 9  },
  { nombre: 'UX/UI PJ 3 (Lina)',       rol: 'UX/UI Designer PJ',         seniority: 'Senior',   asignacion: 100, costoMensual: 2958,  ingresoMensual: 5800, area: 'UX/UI PJ',        incluido: true, mesesEnProyecto: 9  },
  { nombre: 'Juan S. Cardenas PJ',     rol: 'Arquitecto Mobile PJ',      seniority: 'Senior',   asignacion: 100, costoMensual: 5217,  ingresoMensual: 8500, area: 'Arquitectura PJ', incluido: true, mesesEnProyecto: 16 },
  { nombre: 'Jeisson Santacruz PJ',    rol: 'Arquitecto Soluciones PJ',  seniority: 'Senior',   asignacion: 100, costoMensual: 4378,  ingresoMensual: 8500, area: 'Arquitectura PJ', incluido: true, mesesEnProyecto: 13 },
  { nombre: 'Frontend PJ 1',           rol: 'Desarrollador Frontend PJ', seniority: 'Senior',   asignacion: 100, costoMensual: 3924,  ingresoMensual: 6200, area: 'Frontend PJ',     incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Frontend PJ 2',           rol: 'Desarrollador Frontend PJ', seniority: 'Senior',   asignacion: 100, costoMensual: 3924,  ingresoMensual: 6200, area: 'Frontend PJ',     incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Frontend PJ 3',           rol: 'Desarrollador Frontend PJ', seniority: 'Advanced', asignacion: 100, costoMensual: 3243,  ingresoMensual: 6200, area: 'Frontend PJ',     incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Frontend PJ 4',           rol: 'Desarrollador Frontend PJ', seniority: 'Senior',   asignacion: 100, costoMensual: 3924,  ingresoMensual: 6200, area: 'Frontend PJ',     incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Frontend PJ 5',           rol: 'Desarrollador Frontend PJ', seniority: 'Senior',   asignacion: 100, costoMensual: 3924,  ingresoMensual: 6200, area: 'Frontend PJ',     incluido: true, mesesEnProyecto: 11 },
  { nombre: 'Backend PJ 1',            rol: 'Desarrollador Backend PJ',  seniority: 'Senior',   asignacion: 100, costoMensual: 3111,  ingresoMensual: 6200, area: 'Backend PJ',      incluido: true, mesesEnProyecto: 14 },
  { nombre: 'Backend PJ 2',            rol: 'Desarrollador Backend PJ',  seniority: 'Senior',   asignacion: 100, costoMensual: 3111,  ingresoMensual: 6200, area: 'Backend PJ',      incluido: true, mesesEnProyecto: 14 },
  { nombre: 'Backend PJ 3',            rol: 'Desarrollador Backend PJ',  seniority: 'Advanced', asignacion: 100, costoMensual: 2432,  ingresoMensual: 6200, area: 'Backend PJ',      incluido: true, mesesEnProyecto: 14 },
  { nombre: 'Backend PJ 4',            rol: 'Desarrollador Backend PJ',  seniority: 'Senior',   asignacion: 100, costoMensual: 3111,  ingresoMensual: 6200, area: 'Backend PJ',      incluido: true, mesesEnProyecto: 14 },
  { nombre: 'Backend PJ 5',            rol: 'Desarrollador Backend PJ',  seniority: 'Senior',   asignacion: 100, costoMensual: 3111,  ingresoMensual: 6200, area: 'Backend PJ',      incluido: true, mesesEnProyecto: 14 },
  { nombre: 'Backend PJ 6',            rol: 'Desarrollador Backend PJ',  seniority: 'Advanced', asignacion: 100, costoMensual: 2432,  ingresoMensual: 6200, area: 'Backend PJ',      incluido: true, mesesEnProyecto: 14 },
  { nombre: 'QA PJ 1',                 rol: 'QA Engineer PJ',            seniority: 'Senior',   asignacion: 100, costoMensual: 2162,  ingresoMensual: 5100, area: 'QA PJ',           incluido: true, mesesEnProyecto: 14 },
  { nombre: 'QA PJ 2',                 rol: 'QA Engineer PJ',            seniority: 'Senior',   asignacion: 100, costoMensual: 2162,  ingresoMensual: 5100, area: 'QA PJ',           incluido: true, mesesEnProyecto: 14 },
  { nombre: 'QA PJ 3',                 rol: 'QA Engineer PJ',            seniority: 'Senior',   asignacion: 100, costoMensual: 2162,  ingresoMensual: 5100, area: 'QA PJ',           incluido: true, mesesEnProyecto: 14 },
  { nombre: 'QA PJ 4',                 rol: 'QA Engineer PJ',            seniority: 'Senior',   asignacion: 100, costoMensual: 2162,  ingresoMensual: 5100, area: 'QA PJ',           incluido: true, mesesEnProyecto: 11 },
  { nombre: 'QA PJ 5',                 rol: 'QA Engineer PJ',            seniority: 'Senior',   asignacion: 100, costoMensual: 2162,  ingresoMensual: 5100, area: 'QA PJ',           incluido: true, mesesEnProyecto: 11 },
  { nombre: 'QA PJ 7',                 rol: 'QA Engineer PJ',            seniority: 'Senior',   asignacion: 100, costoMensual: 2162,  ingresoMensual: 5100, area: 'QA PJ',           incluido: true, mesesEnProyecto: 11 },
  { nombre: 'QA PJ 8',                 rol: 'QA Engineer PJ',            seniority: 'Advanced', asignacion: 100, costoMensual: 2162,  ingresoMensual: 5100, area: 'QA PJ',           incluido: true, mesesEnProyecto: 11 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function rowToMember(row) {
  return {
    id:               row.id,
    nombre:           row.nombre,
    rol:              row.rol,
    seniority:        row.seniority,
    asignacion:       Number(row.asignacion),
    costoMensual:     Number(row.costo_mensual),
    ingresoMensual:   Number(row.ingreso_mensual),
    area:             row.area,
    incluido:         row.incluido,
    mesesEnProyecto:  Number(row.meses_en_proyecto),
  };
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const pool   = getPool();
  const client = await pool.connect();

  try {
    await ensureTable(client);

    // ── GET — listar todos ──────────────────────────────────────────────────
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const action = url.searchParams.get('action');

      // Seed automático si la tabla está vacía
      const { rows: countRows } = await client.query('SELECT COUNT(*) FROM team_members');
      if (Number(countRows[0].count) === 0 || action === 'reset') {
        await client.query('DELETE FROM team_members');
        await client.query('ALTER SEQUENCE team_members_id_seq RESTART WITH 1');
        for (const m of INITIAL_DATA) {
          await client.query(
            `INSERT INTO team_members
               (nombre, rol, seniority, asignacion, costo_mensual, ingreso_mensual, area, incluido, meses_en_proyecto)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [m.nombre, m.rol, m.seniority, m.asignacion, m.costoMensual, m.ingresoMensual, m.area, m.incluido, m.mesesEnProyecto]
          );
        }
      }

      const { rows } = await client.query('SELECT * FROM team_members ORDER BY id');
      return send(res, 200, rows.map(rowToMember));
    }

    // ── POST — crear miembro ────────────────────────────────────────────────
    if (req.method === 'POST') {
      const m = await readBody(req);
      const { rows } = await client.query(
        `INSERT INTO team_members
           (nombre, rol, seniority, asignacion, costo_mensual, ingreso_mensual, area, incluido, meses_en_proyecto)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [m.nombre, m.rol, m.seniority ?? 'Senior', m.asignacion ?? 100,
         m.costoMensual ?? 0, m.ingresoMensual ?? 0, m.area ?? 'Backend',
         m.incluido ?? true, m.mesesEnProyecto ?? 22]
      );
      return send(res, 201, rowToMember(rows[0]));
    }

    // ── PUT — actualizar miembro ────────────────────────────────────────────
    if (req.method === 'PUT') {
      const m = await readBody(req);
      if (!m.id) return send(res, 400, { error: 'id requerido' });
      const { rows } = await client.query(
        `UPDATE team_members SET
           nombre=$1, rol=$2, seniority=$3, asignacion=$4,
           costo_mensual=$5, ingreso_mensual=$6, area=$7,
           incluido=$8, meses_en_proyecto=$9
         WHERE id=$10
         RETURNING *`,
        [m.nombre, m.rol, m.seniority, m.asignacion,
         m.costoMensual, m.ingresoMensual, m.area,
         m.incluido, m.mesesEnProyecto, m.id]
      );
      if (!rows.length) return send(res, 404, { error: 'No encontrado' });
      return send(res, 200, rowToMember(rows[0]));
    }

    // ── DELETE — eliminar miembro ───────────────────────────────────────────
    if (req.method === 'DELETE') {
      const url = new URL(req.url, 'http://localhost');
      const id  = url.searchParams.get('id');
      if (!id) return send(res, 400, { error: 'id requerido' });
      await client.query('DELETE FROM team_members WHERE id=$1', [id]);
      return send(res, 200, { ok: true });
    }

    send(res, 405, { error: 'Método no permitido' });

  } catch (err) {
    console.error('[team-members]', err);
    send(res, 500, { error: err.message });
  } finally {
    client.release();
  }
}
