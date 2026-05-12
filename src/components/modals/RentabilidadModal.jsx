import { useState, useEffect, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Icon } from '../ui/Icon';
import { STATUS_DONE, STATUS_EXCLUDED, categorize, countByStatus } from '../../utils/jira';

// ── Datos del Excel "Capacidades Presupuestadas" (hoja PJ Actualizada) ────
// Fuente: public/resources/Capacidades presupuestadas.xlsx
const CAPACIDADES = [
  // ROL                          NOMBRE                              MESES  USD_MES  CANAL
  { rol: 'DM',                    nombre: 'Monica Restrepo',          meses: 22, usd: 7000,  canal: 'Todos' },
  { rol: 'Gerente de Proyecto',   nombre: 'Daniela Urrego',           meses: 22, usd: 7000,  canal: 'PN-PJ-BO' },
  { rol: 'Gerente de Proyecto 2', nombre: 'Valeria Salazar',          meses: 21, usd: 7000,  canal: 'PN-PJ-BO' },
  { rol: 'Business Consultant',   nombre: 'Valentina Villegas',       meses: 9.5,usd: 8000,  canal: 'PN-PJ-BO' },
  { rol: 'Líder de Arquitectura', nombre: 'Jairo Duarte',             meses: 22, usd: 8500,  canal: 'PN-PJ-BO' },
  { rol: 'Ing. DevOps 1',         nombre: 'Kaylee Danae Paez',        meses: 22, usd: 6200,  canal: 'PN-PJ-BO' },
  { rol: 'Líder Técnico Backend', nombre: 'Abraham Abner Vega',       meses: 22, usd: 7000,  canal: 'PN-PJ-BO' },
  { rol: 'Líder Técnico Backend', nombre: 'Juan Carlos Suarez',       meses: 22, usd: 7000,  canal: 'PN-PJ-BO' },
  { rol: 'UX/UI 1',               nombre: 'Mauricio Acevedo',         meses: 10, usd: 5800,  canal: 'PN' },
  { rol: 'UX/UI 2',               nombre: 'Alvaro José Uribe',        meses: 10, usd: 5800,  canal: 'PN' },
  { rol: 'UX/UI 3',               nombre: 'Lina Maria Valencia',      meses: 10, usd: 5800,  canal: 'PN' },
  { rol: 'Arq. Soluciones 1',     nombre: 'Andres Useche',            meses: 13, usd: 8500,  canal: 'PN' },
  { rol: 'Arq. Mobile 1',         nombre: 'Juan Sebastian Cardenas',  meses: 8,  usd: 8500,  canal: 'PN' },
  { rol: 'Arq. Mobile 2',         nombre: 'Jeisson Santacruz',        meses: 8,  usd: 8500,  canal: 'PN' },
  { rol: 'Backend 1',             nombre: 'Backend 1',                meses: 10.5,usd: 6200, canal: 'PN' },
  { rol: 'Backend 2',             nombre: 'Santiago Suaza',           meses: 10, usd: 6200,  canal: 'PN' },
  { rol: 'Backend 3',             nombre: 'Kevin Ruda',               meses: 10, usd: 6200,  canal: 'PN' },
  { rol: 'Backend 4',             nombre: 'Santiago Apraez',          meses: 10, usd: 6200,  canal: 'PN' },
  { rol: 'Backend 5',             nombre: 'Daniel Mateo Guerra',      meses: 10, usd: 6200,  canal: 'PN' },
  { rol: 'Frontend 1',            nombre: 'Angie Rivera',             meses: 11, usd: 6200,  canal: 'PN' },
  { rol: 'Frontend 2',            nombre: 'Juan Sebastian Caceres',   meses: 11, usd: 6200,  canal: 'PN' },
  { rol: 'Frontend 3',            nombre: 'Hildelbrando Rios',        meses: 11, usd: 6200,  canal: 'PN' },
  { rol: 'Frontend 4',            nombre: 'René José Cardona',        meses: 11, usd: 6200,  canal: 'PN' },
  { rol: 'Frontend 5',            nombre: 'Hugo Padilla',             meses: 10, usd: 6200,  canal: 'PN' },
  { rol: 'Frontend 6',            nombre: 'Frontend 6',               meses: 10, usd: 6200,  canal: 'PN' },
  { rol: 'QA 1',                  nombre: 'David Henao',              meses: 10, usd: 5100,  canal: 'PN' },
  { rol: 'QA 2',                  nombre: 'QA 2',                     meses: 10, usd: 5100,  canal: 'PN' },
  { rol: 'QA 3',                  nombre: 'QA 3',                     meses: 10, usd: 5100,  canal: 'PN' },
];

const PRESUPUESTO_INICIAL  = 923200;   // Hoja Inicial
const PRESUPUESTO_ACTUAL   = 1162400;  // Hoja PJ Actualizada
const MESES_PROYECTO       = 22;
const MESES_EJECUTADOS     = 16;       // Meses transcurridos (sprints 1-16)

// Costo total presupuestado por persona
const totalPresupuestado = CAPACIDADES.reduce((s, p) => s + p.meses * p.usd, 0);
// Costo ejecutado estimado (proporcional a meses ejecutados)
const costoEjecutado = CAPACIDADES.reduce((s, p) => {
  const mesesEjec = Math.min(p.meses, MESES_EJECUTADOS);
  return s + mesesEjec * p.usd;
}, 0);

// Agrupa capacidades por tipo de rol
function getRolGroup(rol) {
  if (/frontend/i.test(rol)) return 'Frontend';
  if (/backend/i.test(rol)) return 'Backend';
  if (/qa/i.test(rol)) return 'QA';
  if (/ux|ui/i.test(rol)) return 'UX/UI';
  if (/arq|arquitect/i.test(rol)) return 'Arquitectura';
  if (/devops/i.test(rol)) return 'DevOps';
  if (/gerente|dm|project/i.test(rol)) return 'Gestión';
  return 'Otros';
}

const GROUP_COLORS = {
  Frontend:     { color: '#3b82f6', bg: '#dbeafe' },
  Backend:      { color: '#7B3FE4', bg: '#ede9ff' },
  QA:           { color: '#f59e0b', bg: '#fef3c7' },
  'UX/UI':      { color: '#ec4899', bg: '#fce7f3' },
  Arquitectura: { color: '#8b5cf6', bg: '#f3e8ff' },
  DevOps:       { color: '#14b8a6', bg: '#ccfbf1' },
  Gestión:      { color: '#2D0066', bg: '#ede9ff' },
  Otros:        { color: '#94a3b8', bg: '#f1f5f9' },
};

function KpiCard({ label, value, sub, color = '#7B3FE4', icon, trend }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: `1.5px solid ${color}22`, flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon name={icon} size={16} color={color} />
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Icon name={trend >= 0 ? 'trending_up' : 'trending_down'} size={14} color={trend >= 0 ? '#22c55e' : '#ef4444'} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function RentabilidadModal({ onClose }) {
  const store = useDashboardStore();

  // Issues de todas las categorías
  const allIssues = useMemo(() => {
    const raw = store.rawIssues;
    return [
      ...(raw.issHfMvp || []),
      ...(raw.issHfR1  || []),
      ...(raw.issHabFront || []),
      ...(raw.issHabBack  || []),
      ...(raw.issHt  || []),
      ...(raw.issDef || []),
    ].filter(i => !STATUS_EXCLUDED.includes(i.fields?.status?.name || ''));
  }, [store.rawIssues]);

  const totalIssues   = allIssues.length;
  const doneIssues    = allIssues.filter(i => STATUS_DONE.includes(i.fields?.status?.name || '')).length;
  const pctAvance     = totalIssues > 0 ? (doneIssues / totalIssues) * 100 : 0;

  // Costo por issue entregado
  const costoPorIssue = doneIssues > 0 ? costoEjecutado / doneIssues : 0;

  // Proyección de costo al completar
  const costoProyectado = pctAvance > 0 ? (costoEjecutado / (pctAvance / 100)) : PRESUPUESTO_ACTUAL;

  // Desviación vs presupuesto
  const desviacionPct = ((costoProyectado - PRESUPUESTO_ACTUAL) / PRESUPUESTO_ACTUAL) * 100;

  // Eficiencia: issues entregados por $1000 invertidos
  const eficiencia = costoEjecutado > 0 ? (doneIssues / (costoEjecutado / 1000)) : 0;

  // Distribución de costo por grupo de rol
  const costoPorGrupo = {};
  CAPACIDADES.forEach(p => {
    const g = getRolGroup(p.rol);
    costoPorGrupo[g] = (costoPorGrupo[g] || 0) + p.meses * p.usd;
  });

  // Issues por asignado (top 10)
  const issuesPorPersona = {};
  allIssues.forEach(i => {
    const name = i.fields?.assignee?.displayName || 'Sin asignar';
    if (!issuesPorPersona[name]) issuesPorPersona[name] = { total: 0, done: 0 };
    issuesPorPersona[name].total++;
    if (STATUS_DONE.includes(i.fields?.status?.name || '')) issuesPorPersona[name].done++;
  });
  const topPersonas = Object.entries(issuesPorPersona)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  // Cruce: personas del Excel que tienen issues en Jira
  const crucePersonas = CAPACIDADES.map(p => {
    const jiraData = issuesPorPersona[p.nombre] || { total: 0, done: 0 };
    const costoTotal = p.meses * p.usd;
    const costoPorIssuePersona = jiraData.done > 0 ? costoTotal / jiraData.done : null;
    return { ...p, jiraTotal: jiraData.total, jiraDone: jiraData.done, costoTotal, costoPorIssuePersona };
  }).filter(p => p.jiraTotal > 0);

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const fmt = (n) => new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,0,50,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10003, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#f9f7ff', borderRadius: 20, width: '100%', maxWidth: 1000, maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 24px 70px rgba(45,0,102,0.4)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '2px solid #EDE9FE', position: 'sticky', top: 0, background: '#f9f7ff', borderRadius: '20px 20px 0 0', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="analytics" size={24} color="#7B3FE4" />
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2D0066' }}>Análisis de Rentabilidad</div>
              <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 2 }}>Capacidades presupuestadas vs avance en Jira</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
            <Icon name="close" size={20} color="#888" />
          </button>
        </div>

        <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── KPIs principales ── */}
          <div>
            <SectionTitle icon="insights" label="Resumen Ejecutivo" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <KpiCard label="Presupuesto Total" value={fmt(PRESUPUESTO_ACTUAL)} sub={`Inicial: ${fmt(PRESUPUESTO_INICIAL)}`} color="#2D0066" icon="account_balance_wallet" />
              <KpiCard label="Costo Ejecutado" value={fmt(costoEjecutado)} sub={`${MESES_EJECUTADOS} de ${MESES_PROYECTO} meses`} color="#7B3FE4" icon="payments" trend={((costoEjecutado/PRESUPUESTO_ACTUAL)*100)-100} />
              <KpiCard label="Avance del Proyecto" value={`${pctAvance.toFixed(1)}%`} sub={`${doneIssues} / ${totalIssues} issues`} color="#22c55e" icon="task_alt" />
              <KpiCard label="Costo por Issue" value={fmt(costoPorIssue)} sub="por issue entregado" color="#f59e0b" icon="price_check" />
            </div>
          </div>

          {/* ── Proyección y eficiencia ── */}
          <div>
            <SectionTitle icon="trending_up" label="Proyección y Eficiencia" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <KpiCard label="Costo Proyectado Final" value={fmt(costoProyectado)} sub="al 100% de avance" color={desviacionPct > 10 ? '#ef4444' : desviacionPct > 0 ? '#f59e0b' : '#22c55e'} icon="calculate" trend={desviacionPct} />
              <KpiCard label="Eficiencia" value={`${eficiencia.toFixed(2)}`} sub="issues entregados por $1,000" color="#3b82f6" icon="speed" />
              <KpiCard label="Desviación vs Inicial" value={fmt(PRESUPUESTO_ACTUAL - PRESUPUESTO_INICIAL)} sub={`+${(((PRESUPUESTO_ACTUAL-PRESUPUESTO_INICIAL)/PRESUPUESTO_INICIAL)*100).toFixed(1)}% sobre plan inicial`} color="#ef4444" icon="warning" />
            </div>
          </div>

          {/* ── Distribución de costo por grupo ── */}
          <div>
            <SectionTitle icon="pie_chart" label="Distribución de Costo por Disciplina" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {Object.entries(costoPorGrupo).sort((a,b) => b[1]-a[1]).map(([grupo, costo]) => {
                const gc = GROUP_COLORS[grupo] || GROUP_COLORS.Otros;
                const pct = ((costo / totalPresupuestado) * 100).toFixed(1);
                return (
                  <div key={grupo} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: `1.5px solid ${gc.color}22` }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: gc.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{grupo}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: gc.color }}>{pct}%</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{fmt(costo)}</div>
                    <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: gc.color, borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Cruce personas Excel ↔ Jira ── */}
          {crucePersonas.length > 0 && (
            <div>
              <SectionTitle icon="people" label="Cruce Capacidades ↔ Jira (personas con issues asignados)" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#2D0066', color: '#fff' }}>
                      {['Nombre', 'Rol', 'Meses', 'Costo Total', 'Issues Total', 'Issues Done', '% Avance', 'Costo/Issue'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {crucePersonas.map((p, idx) => {
                      const pctP = p.jiraTotal > 0 ? (p.jiraDone / p.jiraTotal * 100) : 0;
                      const eficP = p.costoPorIssuePersona;
                      return (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#f7f5ff' : '#fff' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.nombre}</td>
                          <td style={{ padding: '8px 12px', color: '#6b7280' }}>{p.rol}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{p.meses}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#2D0066' }}>{fmt(p.costoTotal)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{p.jiraTotal}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{p.jiraDone}</span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pctP}%`, background: pctP >= 70 ? '#22c55e' : pctP >= 40 ? '#f59e0b' : '#ef4444', borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, minWidth: 32 }}>{pctP.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px', color: eficP && eficP < costoPorIssue ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                            {eficP ? fmt(eficP) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Top 10 personas por issues en Jira ── */}
          <div>
            <SectionTitle icon="leaderboard" label="Top 10 — Productividad en Jira" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {topPersonas.map(([nombre, data], idx) => {
                const pctP = data.total > 0 ? (data.done / data.total * 100) : 0;
                const enExcel = CAPACIDADES.some(p => p.nombre === nombre);
                return (
                  <div key={nombre} style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid #ede9ff', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#c4b5fd', minWidth: 24 }}>#{idx+1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</span>
                        {enExcel && <span style={{ background: '#ede9ff', color: '#7B3FE4', borderRadius: 4, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>PRESUP.</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pctP}%`, background: '#7B3FE4', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{data.done}/{data.total} · {pctP.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Tabla completa de capacidades ── */}
          <div>
            <SectionTitle icon="table_chart" label="Capacidades Presupuestadas — Detalle" />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.79rem' }}>
                <thead>
                  <tr style={{ background: '#2D0066', color: '#fff' }}>
                    {['Rol', 'Nombre', 'Canal', 'Seniority', 'Meses', 'USD/mes', 'Total USD', 'Grupo'].map(h => (
                      <th key={h} style={{ padding: '8px 11px', textAlign: 'left', fontWeight: 600, fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CAPACIDADES.map((p, idx) => {
                    const gc = GROUP_COLORS[getRolGroup(p.rol)] || GROUP_COLORS.Otros;
                    return (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#f7f5ff' : '#fff' }}>
                        <td style={{ padding: '7px 11px', fontWeight: 600 }}>{p.rol}</td>
                        <td style={{ padding: '7px 11px' }}>{p.nombre || '—'}</td>
                        <td style={{ padding: '7px 11px', color: '#6b7280' }}>{p.canal}</td>
                        <td style={{ padding: '7px 11px' }}>
                          <span style={{ background: gc.bg, color: gc.color, borderRadius: 4, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {getRolGroup(p.rol)}
                          </span>
                        </td>
                        <td style={{ padding: '7px 11px', textAlign: 'center', fontWeight: 700 }}>{p.meses}</td>
                        <td style={{ padding: '7px 11px' }}>{fmt(p.usd)}</td>
                        <td style={{ padding: '7px 11px', fontWeight: 700, color: '#2D0066' }}>{fmt(p.meses * p.usd)}</td>
                        <td style={{ padding: '7px 11px' }}>
                          <span style={{ background: gc.bg, color: gc.color, borderRadius: 4, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {getRolGroup(p.rol)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#2D0066', color: '#fff', fontWeight: 800 }}>
                    <td colSpan={4} style={{ padding: '9px 11px' }}>TOTAL</td>
                    <td style={{ padding: '9px 11px', textAlign: 'center' }}>{CAPACIDADES.reduce((s,p)=>s+p.meses,0).toFixed(1)}</td>
                    <td style={{ padding: '9px 11px' }}>—</td>
                    <td style={{ padding: '9px 11px' }}>{fmt(totalPresupuestado)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Icon name={icon} size={16} color="#7B3FE4" />
      <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4A0099' }}>{label}</span>
      <div style={{ flex: 1, height: 2, background: '#EDE9FE', borderRadius: 2 }} />
    </div>
  );
}
