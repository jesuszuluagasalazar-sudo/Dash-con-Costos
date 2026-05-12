/**
 * StatusBarChart — Barras horizontales estilizadas para distribución por estado.
 * Reemplaza los Doughnut charts con un diseño más limpio y legible.
 */
import { Icon } from './Icon';

const STATUS_CONFIG = [
  { key: 'done',       label: 'Finalizado',    color: '#22c55e', bg: '#dcfce7', icon: 'check_circle' },
  { key: 'qa',         label: 'En QA',         color: '#3b82f6', bg: '#dbeafe', icon: 'manage_search' },
  { key: 'inProgress', label: 'En Progreso',   color: '#f59e0b', bg: '#fef3c7', icon: 'bolt' },
  { key: 'refinement', label: 'Refinamiento',  color: '#a855f7', bg: '#f3e8ff', icon: 'tune' },
  { key: 'blocked',    label: 'Bloqueado',     color: '#ef4444', bg: '#fee2e2', icon: 'block' },
  { key: 'pending',    label: 'Pendiente',     color: '#94a3b8', bg: '#f1f5f9', icon: 'schedule' },
];

export function StatusBarChart({ cats, total, title }) {
  return (
    <div className="chart-card">
      {title && <h3>{title}</h3>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
        {STATUS_CONFIG.map((cfg) => {
          const val = cats[cfg.key] || 0;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return (
            <div key={cfg.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Icono + label */}
              <div style={{ width: 130, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Icon name={cfg.icon} size={16} color={cfg.color} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                  {cfg.label}
                </span>
              </div>
              {/* Barra */}
              <div style={{
                flex: 1, height: 22, background: '#f1f5f9',
                borderRadius: 99, overflow: 'hidden', position: 'relative',
              }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: `linear-gradient(90deg, ${cfg.color}cc, ${cfg.color})`,
                  borderRadius: 99,
                  transition: 'width 0.6s cubic-bezier(.22,.68,0,1.2)',
                  minWidth: val > 0 ? 6 : 0,
                }} />
              </div>
              {/* Valor + % */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 70 }}>
                <span style={{
                  background: cfg.bg, color: cfg.color, borderRadius: 6,
                  padding: '2px 8px', fontSize: '0.76rem', fontWeight: 800,
                }}>
                  {val}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
        {/* Total */}
        <div style={{
          marginTop: 4, paddingTop: 10,
          borderTop: '1px solid #f0ebff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2D0066' }}>{total}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * CompareBarChart — Barras horizontales para comparar dos grupos (ej. MVP vs R1, Front vs Back).
 */
export function CompareBarChart({ title, groups, labels }) {
  // groups = [{ label, color, data: [n, n, n, n, n] }, ...]
  // labels = ['Finalizado', 'En QA', ...]
  const maxVal = Math.max(...groups.flatMap(g => g.data), 1);

  return (
    <div className="chart-card">
      {title && <h3>{title}</h3>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
        {labels.map((lbl, idx) => (
          <div key={lbl}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {lbl}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {groups.map(g => {
                const val = g.data[idx] || 0;
                const pct = Math.round((val / maxVal) * 100);
                return (
                  <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 60, fontSize: '0.72rem', fontWeight: 600, color: '#374151', flexShrink: 0 }}>
                      {g.label}
                    </span>
                    <div style={{ flex: 1, height: 18, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: g.color,
                        borderRadius: 99,
                        transition: 'width 0.6s cubic-bezier(.22,.68,0,1.2)',
                        minWidth: val > 0 ? 4 : 0,
                      }} />
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#374151', minWidth: 28, textAlign: 'right' }}>
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
