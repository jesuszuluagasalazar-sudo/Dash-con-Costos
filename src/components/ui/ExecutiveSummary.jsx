import { useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { STATUS_DONE } from '../../utils/jira';
import { Icon } from './Icon';

function pct(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 1000) / 10; // 1 decimal
}

function countDone(issues) {
  return (issues || []).filter(i => STATUS_DONE.includes(i.fields?.status?.name || '')).length;
}

const CARDS = [
  {
    key:   'hf',
    label: 'HISTORIAS FUNCIONALES',
    keys:  ['issHfMvp', 'issHfR1'],
    color: '#4C1D95',
    light: false,
  },
  {
    key:   'hab',
    label: 'HABILITADORES',
    keys:  ['issHabFront', 'issHabBack'],
    color: '#4C1D95',
    light: false,
  },
  {
    key:   'ht',
    label: 'HT BACKEND',
    keys:  ['issHt'],
    color: '#4C1D95',
    light: false,
  },
  {
    key:   'def',
    label: 'DEFECTOS',
    keys:  ['issDef'],
    color: '#C4B5FD',   // más claro para defectos (igual que la imagen)
    light: true,
  },
];

const formatUSD = (value) => `USD ${value.toLocaleString('en-US')}`;
const formatCOP = (value) => `COP ${value.toLocaleString('es-CO')}`;
const TRM = 3700; // Tasa de cambio COP/USD

export function ExecutiveSummary() {
  const store         = useDashboardStore();
  const teamData      = useDashboardStore(s => s.teamData);
  const loading       = useDashboardStore(s => s.teamDataLoading);
  const extraCosts    = useDashboardStore(s => s.extraCosts);
  const extraRevenues = useDashboardStore(s => s.extraRevenues);

  // Ya no necesitamos cargar datos localmente — vienen del store global

  // Calcular indicadores financieros dinámicamente
  const financialIndicators = useMemo(() => {
    const included = teamData.filter(m => m.incluido);
    
    const costoMensual   = included.reduce((sum, m) => sum + m.costoMensual, 0);
    const ingresoMensual = included.reduce((sum, m) => sum + m.ingresoMensual, 0);
    
    const costoBase = included.reduce((sum, m) => {
      const meses = m.mesesEnProyecto || 22;
      return sum + (m.costoMensual * meses);
    }, 0);
    
    const ingresoBase = included.reduce((sum, m) => {
      const meses = m.mesesEnProyecto || 22;
      return sum + (m.ingresoMensual * meses);
    }, 0);

    // Sumar ajustes adicionales
    const totalExtraCost    = extraCosts.reduce((s, c) => s + (c.monto || 0), 0);
    const totalExtraRevenue = extraRevenues.reduce((s, r) => s + (r.monto || 0), 0);

    const costoTotal   = costoBase   + totalExtraCost;
    const ingresoTotal = ingresoBase + totalExtraRevenue;
    
    const margen   = ingresoTotal > 0 ? ((ingresoTotal - costoTotal) / ingresoTotal * 100) : 0;
    const utilidad = ingresoTotal - costoTotal;
    
    return {
      costoTotal: { usd: Math.round(costoTotal), cop: Math.round(costoTotal * TRM) },
      precioConAdenda: { 
        usd: Math.round(ingresoTotal), 
        precioInicial: Math.round(ingresoTotal / 1.07), 
        contingencia7: Math.round(ingresoTotal - (ingresoTotal / 1.07))
      },
      margen: { percent: margen, utilidad: Math.round(utilidad) },
      equipo: { size: included.length, label: 'miembros activos' },
    };
  }, [teamData, extraCosts, extraRevenues]);

  // Calcular distribución del equipo por área
  const teamDistribution = useMemo(() => {
    const included = teamData.filter(m => m.incluido);
    
    // Alineación: Alineación
    const alineacion = included.filter(m => m.area === 'Alineación').length;
    
    // Desarrollo: Backend, Frontend, Backend PJ, Frontend PJ
    const desarrollo = included.filter(m => 
      m.area === 'Backend' || 
      m.area === 'Frontend' || 
      m.area === 'Backend PJ' || 
      m.area === 'Frontend PJ'
    ).length;
    
    // Soporte y Calidad: UX/UI, Arquitectura, Arquitectura PJ, QA
    const soporte = included.filter(m => 
      m.area === 'UX/UI' || 
      m.area === 'Arquitectura' || 
      m.area === 'Arquitectura PJ' || 
      m.area === 'QA'
    ).length;
    
    return { alineacion, desarrollo, soporte };
  }, [teamData]);

  const cards = useMemo(() => {
    return CARDS.map(card => {
      let issues = [];
      
      // Para Historias Funcionales, usar los issues filtrados del store si existen
      if (card.key === 'hf') {
        const mvpFiltered = store.tabFilteredIssues.hfMvp;
        const r1Filtered  = store.tabFilteredIssues.hfR1;
        
        // Si hay issues filtrados, aplicar solo el filtro de empresa
        const applyEmpresaFilter = (issueList) => {
          if (store.activeFilter === 'all') return issueList;
          return issueList.filter(i => {
            const email = i.fields?.assignee?.emailAddress || '';
            const isPragma = email.includes('_pragma@');
            return store.activeFilter === 'pragma' ? isPragma : !isPragma;
          });
        };
        
        // Filtro para excluir estados Desestimado y Reclasificado
        const excludeDesestimado = (issueList) => {
          return issueList.filter(i => {
            const status = i.fields?.status?.name || '';
            return status !== 'Desestimado' && status !== 'Reclasificado';
          });
        };
        
        // Si hay filtro de versión activo en MVP o R1, usar solo esos issues
        // Si ambos tienen filtro, sumar ambos
        // Si ninguno tiene filtro, usar los issues base
        if (mvpFiltered !== null || r1Filtered !== null) {
          const mvpIssues = mvpFiltered !== null 
            ? excludeDesestimado(applyEmpresaFilter(mvpFiltered)) 
            : [];
          const r1Issues = r1Filtered !== null 
            ? excludeDesestimado(applyEmpresaFilter(r1Filtered)) 
            : [];
          issues = [...mvpIssues, ...r1Issues];
        } else {
          // Sin filtros de versión, usar los issues base
          issues = [
            ...store.getFilteredIssues('issHfMvp'),
            ...store.getFilteredIssues('issHfR1')
          ];
        }
      } else {
        issues = card.keys.flatMap(k => store.getFilteredIssues(k));
      }
      
      const total  = issues.length;
      const done   = countDone(issues);
      const p      = pct(done, total);
      return { ...card, done, total, pct: p };
    });
  }, [
    store.rawIssues,
    store.activeFilter,
    store.advFilters,
    store.tabVersionFilters,
    store.tabFilteredIssues,
  ]);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Título de sección */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 16,
      }}>
        <span style={{
          fontSize: '0.82rem', fontWeight: 800, color: '#4C1D95',
          letterSpacing: '0.04em',
        }}>
          Resumen Ejecutivo
        </span>
        <div style={{ flex: 1, height: 1, background: '#DDD6FE' }} />
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0,
        background: '#fff',
        borderRadius: 16,
        border: '1.5px solid #EDE9FE',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(124,58,237,0.07)',
      }}>
        {cards.map((card, idx) => (
          <div
            key={card.key}
            style={{
              padding: '24px 20px 20px',
              borderRight: idx < cards.length - 1 ? '1px solid #EDE9FE' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: '#fff',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FAFAFE'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            {/* Porcentaje */}
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              color: card.color,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              {card.pct}%
            </div>

            {/* Label */}
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: card.light ? '#A78BFA' : '#4C1D95',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1.3,
            }}>
              {card.label}
            </div>

            {/* Fracción */}
            <div style={{
              fontSize: '0.8rem',
              color: card.light ? '#C4B5FD' : '#7C3AED',
              fontWeight: 600,
              marginTop: 2,
            }}>
              {card.done} / {card.total}
            </div>

            {/* Mini barra de progreso */}
            <div style={{
              height: 4,
              background: '#EDE9FE',
              borderRadius: 99,
              marginTop: 6,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${card.pct}%`,
                background: card.light
                  ? 'linear-gradient(90deg, #C4B5FD, #A78BFA)'
                  : 'linear-gradient(90deg, #7C3AED, #4C1D95)',
                borderRadius: 99,
                transition: 'width 0.8s cubic-bezier(.22,.68,0,1.2)',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          INDICADORES FINANCIEROS
          ══════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 32, marginBottom: 16,
      }}>
        <span style={{
          fontSize: '0.82rem', fontWeight: 800, color: '#4C1D95',
          letterSpacing: '0.04em',
        }}>
          Indicadores Financieros
        </span>
        <div style={{ flex: 1, height: 1, background: '#DDD6FE' }} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
      }}>
        {/* Card 1: Costo Total */}
        <div style={{
          background: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
          borderRadius: 16,
          padding: '24px 20px',
          color: '#fff',
          boxShadow: '0 4px 18px rgba(76,29,149,0.25)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(76,29,149,0.35)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(76,29,149,0.25)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="account_balance_wallet" size={18} color="#E0B0FF" />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', opacity: 0.9 }}>
              Costo Total
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
            {loading ? '...' : formatUSD(financialIndicators.costoTotal.usd)}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
            {loading ? '...' : formatCOP(financialIndicators.costoTotal.cop)}
          </div>
        </div>

        {/* Card 2: Precio PJ */}
        <div style={{
          background: 'linear-gradient(135deg, #059669, #10b981)',
          borderRadius: 16,
          padding: '24px 20px',
          color: '#fff',
          boxShadow: '0 4px 18px rgba(5,150,105,0.25)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(5,150,105,0.35)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(5,150,105,0.25)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="payments" size={18} color="#d1fae5" />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', opacity: 0.9 }}>
              Precio PJ + Contingencia 7%
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
            {loading ? '...' : formatUSD(financialIndicators.precioConAdenda.usd)}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
            {loading ? '...' : `Base: ${formatUSD(financialIndicators.precioConAdenda.precioInicial)} + ${formatUSD(financialIndicators.precioConAdenda.contingencia7)}`}
          </div>
        </div>

        {/* Card 3: Margen */}
        <div style={{
          background: financialIndicators.margen.percent >= 0 
            ? 'linear-gradient(135deg, #0284c7, #0ea5e9)'
            : 'linear-gradient(135deg, #dc2626, #ef4444)',
          borderRadius: 16,
          padding: '24px 20px',
          color: '#fff',
          boxShadow: financialIndicators.margen.percent >= 0
            ? '0 4px 18px rgba(2,132,199,0.25)'
            : '0 4px 18px rgba(220,38,38,0.25)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = financialIndicators.margen.percent >= 0
            ? '0 8px 28px rgba(2,132,199,0.35)'
            : '0 8px 28px rgba(220,38,38,0.35)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = financialIndicators.margen.percent >= 0
            ? '0 4px 18px rgba(2,132,199,0.25)'
            : '0 4px 18px rgba(220,38,38,0.25)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name={financialIndicators.margen.percent >= 0 ? "trending_up" : "trending_down"} size={18} color={financialIndicators.margen.percent >= 0 ? "#bae6fd" : "#fecaca"} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', opacity: 0.9 }}>
              Margen
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
            {loading ? '...' : `${financialIndicators.margen.percent.toFixed(2)}%`}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
            {loading ? '...' : `${financialIndicators.margen.utilidad >= 0 ? 'Utilidad' : 'Pérdida'}: ${formatUSD(Math.abs(financialIndicators.margen.utilidad))}`}
          </div>
        </div>

        {/* Card 4: Equipo */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          borderRadius: 16,
          padding: '24px 20px',
          color: '#fff',
          boxShadow: '0 4px 18px rgba(124,58,237,0.25)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,58,237,0.35)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,58,237,0.25)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="groups" size={18} color="#e9d5ff" />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', opacity: 0.9 }}>
              Equipo
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
            {loading ? '...' : financialIndicators.equipo.size}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
            {financialIndicators.equipo.label}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          DISTRIBUCIÓN DEL EQUIPO POR ÁREA
          ══════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 32, marginBottom: 16,
      }}>
        <span style={{
          fontSize: '0.82rem', fontWeight: 800, color: '#4C1D95',
          letterSpacing: '0.04em',
        }}>
          Distribución del Equipo
        </span>
        <div style={{ flex: 1, height: 1, background: '#DDD6FE' }} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {/* Alineación Funcional y Técnica */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '20px',
          border: '2px solid #EDE9FE',
          boxShadow: '0 2px 8px rgba(124,58,237,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Icon name="engineering" size={18} color="#7C3AED" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4C1D95', letterSpacing: '0.04em' }}>
              Alineación Funcional y Técnica
            </span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#7C3AED', lineHeight: 1, marginBottom: 8 }}>
            {loading ? '...' : teamDistribution.alineacion}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600 }}>
            DM, PM, Business Consultants, Líderes Técnicos
          </div>
        </div>

        {/* Desarrollo */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '20px',
          border: '2px solid #DBEAFE',
          boxShadow: '0 2px 8px rgba(59,130,246,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Icon name="code" size={18} color="#3b82f6" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af', letterSpacing: '0.04em' }}>
              Desarrollo
            </span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3b82f6', lineHeight: 1, marginBottom: 8 }}>
            {loading ? '...' : teamDistribution.desarrollo}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>
            Frontend, Backend, DevOps
          </div>
        </div>

        {/* Soporte y Calidad */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '20px',
          border: '2px solid #D1FAE5',
          boxShadow: '0 2px 8px rgba(16,185,129,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Icon name="verified" size={18} color="#10b981" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065f46', letterSpacing: '0.04em' }}>
              Soporte y Calidad
            </span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', lineHeight: 1, marginBottom: 8 }}>
            {loading ? '...' : teamDistribution.soporte}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            UX/UI, Arquitectos, QA
          </div>
        </div>
      </div>
    </div>
  );
}
