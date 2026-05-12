/**
 * StatusBreakdownTable
 * Tabla de desglose por estado: columnas ESTADO | CANT. | TIPO
 */
import { STATUS_EXCLUDED } from '../../utils/jira';

// Mapeo estado Jira → categoría visual
const STATUS_CATEGORY = {
  'Finalizado':               { label: 'Finalizado',   color: '#7C3AED', bg: '#EDE9FE' },
  'QA Mercantil':             { label: 'Finalizado',   color: '#7C3AED', bg: '#EDE9FE' },
  'For Release':              { label: 'Finalizado',   color: '#7C3AED', bg: '#EDE9FE' },
  'QA Pragma':                { label: 'En QA',        color: '#6366F1', bg: '#E0E7FF' },
  'Inspección Par':           { label: 'En QA',        color: '#6366F1', bg: '#E0E7FF' },
  'En curso':                 { label: 'En progreso',  color: '#60A5FA', bg: '#DBEAFE' },
  'Refinamiento Estratégico': { label: 'Refinamiento', color: '#A78BFA', bg: '#EDE9FE' },
  'Aterrizaje Técnico':       { label: 'Refinamiento', color: '#A78BFA', bg: '#EDE9FE' },
  'Aperturado':               { label: 'Refinamiento', color: '#A78BFA', bg: '#EDE9FE' },
  'Tareas por hacer':         { label: 'Pendiente',    color: '#F472B6', bg: '#FCE7F3' },
  'Bloqueado':                { label: 'Bloqueado',    color: '#ef4444', bg: '#fee2e2' },
};

function getCategoryBadge(statusName) {
  return STATUS_CATEGORY[statusName] || { label: statusName, color: '#94A3B8', bg: '#F1F5F9' };
}

const ORDER = ['Finalizado', 'En QA', 'En progreso', 'Refinamiento', 'Bloqueado', 'Pendiente'];

export function StatusBreakdownTable({ title, issues }) {
  // Contar por estado — excluir Desestimado y Reclasificado
  const counts = {};
  (issues || []).forEach(i => {
    const s = i.fields?.status?.name || 'Desconocido';
    if (STATUS_EXCLUDED.includes(s)) return; // no mostrar ni sumar
    counts[s] = (counts[s] || 0) + 1;
  });

  const rows = Object.entries(counts).sort((a, b) => {
    const catA = getCategoryBadge(a[0]).label;
    const catB = getCategoryBadge(b[0]).label;
    const ia = ORDER.indexOf(catA); const ib = ORDER.indexOf(catB);
    if (ia !== ib) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return b[1] - a[1];
  });

  // Total excluye Desestimado/Reclasificado
  const total = rows.reduce((sum, [, n]) => sum + n, 0);

  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '28px 28px 20px',
      boxShadow: '0 2px 16px rgba(124,58,237,0.08)', border: '1.5px solid #EDE9FE',
    }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 4, height: 22, background: '#7C3AED', borderRadius: 99 }} />
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2D0066', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {title}
          </span>
        </div>
      )}

      {/* Cabecera */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 24px', padding: '0 8px 10px', borderBottom: '2px solid #EDE9FE', marginBottom: 4 }}>
        {['ESTADO', 'CANT.', 'TIPO'].map(h => (
          <span key={h} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h === 'CANT.' ? 'center' : 'left' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Filas */}
      {rows.map(([status, count], idx) => {
        const cat = getCategoryBadge(status);
        return (
          <div
            key={status}
            style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 24px', alignItems: 'center', padding: '12px 8px', borderBottom: idx < rows.length - 1 ? '1px solid #F5F3FF' : 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FAFAFE'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>{status}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a1a2e', textAlign: 'center', minWidth: 32 }}>{count}</span>
            <span style={{ background: cat.bg, color: cat.color, borderRadius: 20, padding: '4px 14px', fontSize: '0.76rem', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center', minWidth: 110, display: 'inline-block' }}>
              {cat.label}
            </span>
          </div>
        );
      })}

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '2px solid #EDE9FE', padding: '12px 8px 0' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2D0066' }}>{total}</span>
      </div>
    </div>
  );
}
