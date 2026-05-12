import { useState } from 'react';
import { Icon } from '../ui/Icon';

const formatUSD = (v) => `USD ${Number(v || 0).toLocaleString('en-US')}`;

function ItemRow({ item, onUpdate, onDelete }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 160px 36px',
      gap: 8,
      alignItems: 'center',
      padding: '6px 0',
      borderBottom: '1px solid #F3F0FF',
    }}>
      <input
        type="text"
        value={item.descripcion}
        onChange={e => onUpdate({ ...item, descripcion: e.target.value })}
        placeholder="Descripción..."
        style={{
          padding: '6px 10px', borderRadius: 6, border: '1px solid #DDD6FE',
          fontSize: '0.82rem', color: '#1a1a2e', outline: 'none',
        }}
      />
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
          fontSize: '0.78rem', color: '#7C3AED', fontWeight: 700, pointerEvents: 'none',
        }}>USD</span>
        <input
          type="number"
          value={item.monto}
          onChange={e => onUpdate({ ...item, monto: parseFloat(e.target.value) || 0 })}
          min="0"
          style={{
            width: '100%', padding: '6px 8px 6px 36px', borderRadius: 6,
            border: '1px solid #DDD6FE', fontSize: '0.82rem',
            color: '#1a1a2e', outline: 'none', textAlign: 'right',
          }}
        />
      </div>
      <button
        onClick={onDelete}
        style={{
          width: 32, height: 32, borderRadius: 6, border: 'none',
          background: '#FEE2E2', color: '#ef4444', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Eliminar"
      >
        <Icon name="delete" size={15} />
      </button>
    </div>
  );
}

export function AjustesMargenModal({ extraCosts, extraRevenues, onSave, onClose }) {
  const [costs,    setCosts]    = useState(extraCosts.map(c => ({ ...c })));
  const [revenues, setRevenues] = useState(extraRevenues.map(r => ({ ...r })));

  const addCost = () =>
    setCosts(prev => [...prev, { id: Date.now(), descripcion: '', monto: 0 }]);

  const addRevenue = () =>
    setRevenues(prev => [...prev, { id: Date.now(), descripcion: '', monto: 0 }]);

  const updateCost = (id, updated) =>
    setCosts(prev => prev.map(c => c.id === id ? updated : c));

  const updateRevenue = (id, updated) =>
    setRevenues(prev => prev.map(r => r.id === id ? updated : r));

  const deleteCost    = (id) => setCosts(prev => prev.filter(c => c.id !== id));
  const deleteRevenue = (id) => setRevenues(prev => prev.filter(r => r.id !== id));

  const totalExtraCost    = costs.reduce((s, c) => s + (c.monto || 0), 0);
  const totalExtraRevenue = revenues.reduce((s, r) => s + (r.monto || 0), 0);

  const handleSave = () => {
    onSave(
      costs.filter(c => c.descripcion.trim() || c.monto > 0),
      revenues.filter(r => r.descripcion.trim() || r.monto > 0),
    );
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(45,0,102,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 640,
        boxShadow: '0 20px 60px rgba(45,0,102,0.25)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1.5px solid #EDE9FE',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="tune" size={22} color="#7C3AED" />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2D0066' }}>
                Ajustes de Margen
              </div>
              <div style={{ fontSize: '0.72rem', color: '#7C3AED', marginTop: 2 }}>
                Costos e ingresos adicionales que afectan el cálculo global
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#7C3AED', padding: 4,
          }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>

          {/* ── Costos adicionales ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#ef4444', display: 'inline-block',
                }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2D0066' }}>
                  Costos Adicionales
                </span>
                {totalExtraCost > 0 && (
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, color: '#ef4444',
                    background: '#FEE2E2', borderRadius: 6, padding: '2px 8px',
                  }}>
                    +{formatUSD(totalExtraCost)}
                  </span>
                )}
              </div>
              <button
                onClick={addCost}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', borderRadius: 7,
                  background: '#FEE2E2', color: '#ef4444',
                  border: '1px solid #FECACA', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 700,
                }}
              >
                <Icon name="add" size={14} /> Agregar costo
              </button>
            </div>

            {costs.length === 0 ? (
              <div style={{
                padding: '14px', borderRadius: 8, background: '#FFF5F5',
                border: '1px dashed #FECACA', textAlign: 'center',
                fontSize: '0.78rem', color: '#f87171',
              }}>
                Sin costos adicionales — haz clic en "Agregar costo"
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 36px',
                  gap: 8, padding: '0 0 4px',
                  fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  <span>Descripción</span><span style={{ textAlign: 'right' }}>Monto (USD)</span><span />
                </div>
                {costs.map(c => (
                  <ItemRow
                    key={c.id}
                    item={c}
                    onUpdate={updated => updateCost(c.id, updated)}
                    onDelete={() => deleteCost(c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Ingresos adicionales ── */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#22c55e', display: 'inline-block',
                }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2D0066' }}>
                  Ingresos Adicionales
                </span>
                {totalExtraRevenue > 0 && (
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, color: '#16a34a',
                    background: '#DCFCE7', borderRadius: 6, padding: '2px 8px',
                  }}>
                    +{formatUSD(totalExtraRevenue)}
                  </span>
                )}
              </div>
              <button
                onClick={addRevenue}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', borderRadius: 7,
                  background: '#DCFCE7', color: '#16a34a',
                  border: '1px solid #BBF7D0', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 700,
                }}
              >
                <Icon name="add" size={14} /> Agregar ingreso
              </button>
            </div>

            {revenues.length === 0 ? (
              <div style={{
                padding: '14px', borderRadius: 8, background: '#F0FDF4',
                border: '1px dashed #BBF7D0', textAlign: 'center',
                fontSize: '0.78rem', color: '#4ade80',
              }}>
                Sin ingresos adicionales — haz clic en "Agregar ingreso"
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 36px',
                  gap: 8, padding: '0 0 4px',
                  fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  <span>Descripción</span><span style={{ textAlign: 'right' }}>Monto (USD)</span><span />
                </div>
                {revenues.map(r => (
                  <ItemRow
                    key={r.id}
                    item={r}
                    onUpdate={updated => updateRevenue(r.id, updated)}
                    onDelete={() => deleteRevenue(r.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer — resumen + acciones */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1.5px solid #EDE9FE',
          background: '#FAFAFE',
        }}>
          {/* Resumen del impacto */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
            marginBottom: 14,
          }}>
            <div style={{
              background: '#FEF2F2', borderRadius: 8, padding: '10px 12px',
              border: '1px solid #FECACA',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
                COSTOS EXTRA
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#dc2626' }}>
                +{formatUSD(totalExtraCost)}
              </div>
            </div>
            <div style={{
              background: '#F0FDF4', borderRadius: 8, padding: '10px 12px',
              border: '1px solid #BBF7D0',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>
                INGRESOS EXTRA
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#15803d' }}>
                +{formatUSD(totalExtraRevenue)}
              </div>
            </div>
            <div style={{
              background: '#EDE9FE', borderRadius: 8, padding: '10px 12px',
              border: '1px solid #DDD6FE',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7C3AED', marginBottom: 4 }}>
                IMPACTO NETO
              </div>
              <div style={{
                fontSize: '0.95rem', fontWeight: 900,
                color: (totalExtraRevenue - totalExtraCost) >= 0 ? '#15803d' : '#dc2626',
              }}>
                {(totalExtraRevenue - totalExtraCost) >= 0 ? '+' : ''}
                {formatUSD(totalExtraRevenue - totalExtraCost)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 20px', borderRadius: 8, border: '1.5px solid #DDD6FE',
                background: '#fff', color: '#7C3AED', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 700,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #2D0066, #7B3FE4)',
                color: '#fff', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 700,
                boxShadow: '0 2px 10px rgba(45,0,102,0.25)',
              }}
            >
              Aplicar ajustes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
