import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { AutocompleteSelect } from '../ui/AutocompleteSelect';
import { StatusBarChart, CompareBarChart } from '../ui/StatusBarChart';
import { StatusBreakdownTable } from '../ui/StatusBreakdownTable';
import { Icon } from '../ui/Icon';
import { fetchJiraAll, categorize, countByStatus, pctNum, STATUS_DONE, COLORS } from '../../utils/jira';

const API = '';
const STATUS_LABELS = ['Finalizado', 'En QA', 'En Progreso', 'Refinamiento', 'Pendiente'];

// Carga todos los issues de una versión (HF + Hab + HT + Def)
async function fetchVersionIssues(versionName) {
  const jql = `project = NT AND fixVersion = "${versionName}" AND issuetype in ("Historia Funcional","Habilitador Front","Habilitador Back","HT Backend","Defecto") ORDER BY issuetype ASC`;
  return fetchJiraAll(jql);
}

function groupByType(issues) {
  return {
    hf:   issues.filter(i => i.fields?.issuetype?.name === 'Historia Funcional'),
    habF: issues.filter(i => i.fields?.issuetype?.name === 'Habilitador Front'),
    habB: issues.filter(i => i.fields?.issuetype?.name === 'Habilitador Back'),
    ht:   issues.filter(i => i.fields?.issuetype?.name === 'HT Backend'),
    def:  issues.filter(i => i.fields?.issuetype?.name === 'Defecto' &&
            !['Desestimado','Reclasificado'].includes(i.fields?.status?.name || '')),
  };
}

function countDone(issues) {
  return issues.filter(i => STATUS_DONE.includes(i.fields?.status?.name || '')).length;
}

// Tarjeta de KPI de una versión
function VersionKpi({ label, done, total, color }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '14px 16px',
      border: `2px solid ${color}22`, flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 900, color, lineHeight: 1 }}>{pct}%</div>
      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>{done} / {total} finalizados</div>
      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.8s cubic-bezier(.22,.68,0,1.2)' }} />
      </div>
    </div>
  );
}

// Tabla de diferencias entre dos versiones
function DiffTable({ groupA, groupB, labelA, labelB }) {
  const types = [
    { key: 'hf',   label: 'Historias Funcionales' },
    { key: 'habF', label: 'Habilitador Front' },
    { key: 'habB', label: 'Habilitador Back' },
    { key: 'ht',   label: 'HT Backend' },
    { key: 'def',  label: 'Defectos' },
  ];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: '#2D0066', color: '#fff' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Tipo</th>
            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>{labelA}</th>
            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>{labelB}</th>
            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Δ Issues</th>
            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Δ % Avance</th>
          </tr>
        </thead>
        <tbody>
          {types.map((t, idx) => {
            const issA = groupA[t.key] || [];
            const issB = groupB[t.key] || [];
            const doneA = countDone(issA), doneB = countDone(issB);
            const pctA = issA.length > 0 ? Math.round((doneA / issA.length) * 100) : 0;
            const pctB = issB.length > 0 ? Math.round((doneB / issB.length) * 100) : 0;
            const deltaIss = issB.length - issA.length;
            const deltaPct = pctB - pctA;

            return (
              <tr key={t.key} style={{ background: idx % 2 === 0 ? '#f7f5ff' : '#fff' }}>
                <td style={{ padding: '9px 14px', fontWeight: 600, color: '#374151' }}>{t.label}</td>
                <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                  <span style={{ fontWeight: 700 }}>{doneA}</span>
                  <span style={{ color: '#9ca3af' }}> / {issA.length}</span>
                  <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#7B3FE4', fontWeight: 700 }}>{pctA}%</span>
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                  <span style={{ fontWeight: 700 }}>{doneB}</span>
                  <span style={{ color: '#9ca3af' }}> / {issB.length}</span>
                  <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#7B3FE4', fontWeight: 700 }}>{pctB}%</span>
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                  <span style={{
                    fontWeight: 700, fontSize: '0.82rem',
                    color: deltaIss > 0 ? '#16a34a' : deltaIss < 0 ? '#dc2626' : '#9ca3af',
                  }}>
                    {deltaIss > 0 ? '+' : ''}{deltaIss}
                  </span>
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                  <span style={{
                    fontWeight: 700, fontSize: '0.82rem',
                    color: deltaPct > 0 ? '#16a34a' : deltaPct < 0 ? '#dc2626' : '#9ca3af',
                  }}>
                    {deltaPct > 0 ? '+' : ''}{deltaPct}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function VersionCompareModal({ onClose, currentVersion }) {
  const { versions } = useDashboardStore();

  const [compareVersion, setCompareVersion] = useState('');
  const [stateA, setStateA] = useState({ loading: false, issues: [], error: null });
  const [stateB, setStateB] = useState({ loading: false, issues: [], error: null });

  // Versión A = la seleccionada en el filtro (o MVP_Banca_Personas por defecto)
  const versionA = currentVersion || 'MVP_Banca_Personas';

  const versionOptions = versions.map(v => ({
    value: v.name,
    label: v.name,
    meta:  v.released ? 'Liberada' : '',
  })).filter(v => v.value !== versionA);

  // Cargar issues de versión A al abrir
  const loadA = useCallback(async () => {
    setStateA({ loading: true, issues: [], error: null });
    try {
      const issues = await fetchVersionIssues(versionA);
      setStateA({ loading: false, issues, error: null });
    } catch (err) {
      setStateA({ loading: false, issues: [], error: err.message });
    }
  }, [versionA]);

  // Cargar issues de versión B al seleccionar
  const loadB = useCallback(async (ver) => {
    if (!ver) { setStateB({ loading: false, issues: [], error: null }); return; }
    setStateB({ loading: true, issues: [], error: null });
    try {
      const issues = await fetchVersionIssues(ver);
      setStateB({ loading: false, issues, error: null });
    } catch (err) {
      setStateB({ loading: false, issues: [], error: err.message });
    }
  }, []);

  useEffect(() => { loadA(); }, [loadA]);
  useEffect(() => { loadB(compareVersion); }, [compareVersion, loadB]);

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const groupA = groupByType(stateA.issues);
  const groupB = groupByType(stateB.issues);
  const catA   = categorize(countByStatus(stateA.issues));
  const catB   = categorize(countByStatus(stateB.issues));

  const isLoading = stateA.loading || stateB.loading;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(20,0,50,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10002, padding: 20,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 900,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 24px 70px rgba(45,0,102,0.4)',
        animation: 'slideUp 0.25s cubic-bezier(.22,.68,0,1.2)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px', borderBottom: '2px solid #EDE9FE',
          position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="compare_arrows" size={22} color="#7B3FE4" />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2D0066' }}>
                Comparar Versiones
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                Historias Funcionales, Habilitadores, HT Backend y Defectos
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
          >
            <Icon name="close" size={20} color="#888" />
          </button>
        </div>

        {/* Selector de versiones */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 24px', background: '#f9f7ff',
          borderBottom: '1px solid #EDE9FE', flexWrap: 'wrap',
        }}>
          {/* Versión A (fija) */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7B3FE4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Versión A (actual)
            </div>
            <div style={{
              padding: '8px 12px', background: '#EDE9FE', borderRadius: 8,
              fontSize: '0.85rem', fontWeight: 700, color: '#4C1D95',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="label" size={15} color="#7B3FE4" />
              {versionA}
            </div>
          </div>

          <Icon name="compare_arrows" size={24} color="#c4b5fd" />

          {/* Versión B (seleccionable) */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7B3FE4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Versión B (comparar con)
            </div>
            <AutocompleteSelect
              options={versionOptions}
              value={compareVersion}
              onChange={v => setCompareVersion(v)}
              placeholder="Selecciona una versión..."
              icon="label"
              emptyText="Sin versiones disponibles"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Loader */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '32px 0', color: '#7B3FE4' }}>
              <div style={{ width: 28, height: 28, border: '3px solid #e0d4ff', borderTopColor: '#7B3FE4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '0.9rem' }}>Cargando issues...</span>
            </div>
          )}

          {!isLoading && stateA.issues.length > 0 && (
            <>
              {/* KPIs generales */}
              <div>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4A0099', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="insights" size={16} color="#7B3FE4" />
                  Resumen General
                  <div style={{ flex: 1, height: 2, background: '#EDE9FE', borderRadius: 2 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <VersionKpi
                    label={versionA}
                    done={countDone(stateA.issues)}
                    total={stateA.issues.length}
                    color="#7B3FE4"
                  />
                  {compareVersion && stateB.issues.length > 0 ? (
                    <VersionKpi
                      label={compareVersion}
                      done={countDone(stateB.issues)}
                      total={stateB.issues.length}
                      color="#2D0066"
                    />
                  ) : (
                    <div style={{ background: '#f9f7ff', borderRadius: 12, padding: '14px 16px', border: '2px dashed #e0d4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd', fontSize: '0.85rem' }}>
                      Selecciona la versión B
                    </div>
                  )}
                </div>
              </div>

              {/* Comparativa de barras */}
              {compareVersion && stateB.issues.length > 0 && (
                <>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4A0099', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="bar_chart" size={16} color="#7B3FE4" />
                      Distribución por Estado
                      <div style={{ flex: 1, height: 2, background: '#EDE9FE', borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <StatusBarChart title={versionA} cats={catA} total={stateA.issues.length} />
                      <StatusBarChart title={compareVersion} cats={catB} total={stateB.issues.length} />
                    </div>
                  </div>

                  {/* Gráfica comparativa */}
                  <CompareBarChart
                    title={<><Icon name="compare" size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: '#7B3FE4' }} />{versionA} vs {compareVersion}</>}
                    labels={STATUS_LABELS}
                    groups={[
                      { label: versionA,      color: COLORS.purple3, data: [catA.done, catA.qa, catA.inProgress, catA.refinement, catA.pending] },
                      { label: compareVersion, color: COLORS.purple1, data: [catB.done, catB.qa, catB.inProgress, catB.refinement, catB.pending] },
                    ]}
                  />

                  {/* Tabla de diferencias */}
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4A0099', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="difference" size={16} color="#7B3FE4" />
                      Diferencias por Tipo de Issue
                      <div style={{ flex: 1, height: 2, background: '#EDE9FE', borderRadius: 2 }} />
                    </div>
                    <DiffTable
                      groupA={groupA}
                      groupB={groupB}
                      labelA={versionA}
                      labelB={compareVersion}
                    />
                  </div>

                  {/* Desglose por estado */}
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4A0099', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="table_chart" size={16} color="#7B3FE4" />
                      Desglose por Estado
                      <div style={{ flex: 1, height: 2, background: '#EDE9FE', borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <StatusBreakdownTable title={versionA}      issues={stateA.issues} />
                      <StatusBreakdownTable title={compareVersion} issues={stateB.issues} />
                    </div>
                  </div>
                </>
              )}

              {/* Solo versión A si no hay B */}
              {!compareVersion && (
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4A0099', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="table_chart" size={16} color="#7B3FE4" />
                    Desglose — {versionA}
                    <div style={{ flex: 1, height: 2, background: '#EDE9FE', borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <StatusBarChart title={versionA} cats={catA} total={stateA.issues.length} />
                    <StatusBreakdownTable title={versionA} issues={stateA.issues} />
                  </div>
                </div>
              )}
            </>
          )}

          {!isLoading && stateA.error && (
            <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 18px', color: '#dc2626', fontSize: '0.84rem' }}>
              ⚠️ {stateA.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
