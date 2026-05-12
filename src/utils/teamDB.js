/**
 * teamDB.js — Cliente HTTP para la API de equipo (/api/team-members)
 * Reemplaza la implementación anterior basada en IndexedDB.
 */

const BASE = '/api/team-members';

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getAllTeamMembers() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`getAllTeamMembers: ${res.status}`);
  return res.json();
}

export async function addTeamMember(member) {
  const res = await fetch(BASE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(member),
  });
  if (!res.ok) throw new Error(`addTeamMember: ${res.status}`);
  return res.json();
}

export async function updateTeamMember(member) {
  const res = await fetch(BASE, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(member),
  });
  if (!res.ok) throw new Error(`updateTeamMember: ${res.status}`);
  return res.json();
}

export async function deleteTeamMember(id) {
  const res = await fetch(`${BASE}?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteTeamMember: ${res.status}`);
  return res.json();
}

/** Restaura los datos iniciales en la base de datos */
export async function initializeTeamData() {
  const res = await fetch(`${BASE}?action=reset`);
  if (!res.ok) throw new Error(`initializeTeamData: ${res.status}`);
  return res.json();
}

// ── Métricas derivadas (sin cambios) ─────────────────────────────────────────

/**
 * Calcula métricas derivadas para un miembro.
 * - costoTotalProyecto  = costoMensual  × (asignacion / 100)
 * - ingresoTotalProyecto = ingresoMensual × (asignacion / 100)
 * - margen = ((ingreso - costo) / ingreso) × 100
 * - utilidadMensual = ingresoMensual - costoMensual
 */
export function calculateMemberMetrics(member, _duracionDefault = 22) {
  const asignacionFactor = (member.asignacion || 100) / 100;
  const margen           = member.ingresoMensual > 0
    ? ((member.ingresoMensual - member.costoMensual) / member.ingresoMensual * 100).toFixed(1)
    : '0.0';
  const utilidadMensual     = member.ingresoMensual - member.costoMensual;
  const costoTotalProyecto  = member.costoMensual  * asignacionFactor;
  const ingresoTotalProyecto = member.ingresoMensual * asignacionFactor;

  return {
    ...member,
    margen,
    utilidadMensual,
    costoTotalProyecto,
    ingresoTotalProyecto,
  };
}

// ── Export JSON (sin cambios) ─────────────────────────────────────────────────

export async function exportTeamDataToJSON() {
  const members = await getAllTeamMembers();
  const blob    = new Blob([JSON.stringify(members, null, 2)], { type: 'application/json' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `team-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
