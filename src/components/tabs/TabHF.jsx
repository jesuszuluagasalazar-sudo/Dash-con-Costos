import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { categorize, countByStatus, COLORS } from '../../utils/jira';
import { IssueTable } from '../ui/IssueTable';
import { StatusBarChart, CompareBarChart } from '../ui/StatusBarChart';
import { StatusBreakdownTable } from '../ui/StatusBreakdownTable';
import { AutocompleteSelect } from '../ui/AutocompleteSelect';
import { Icon } from '../ui/Icon';
import { VersionCompareModal } from '../modals/VersionCompareModal';

const API = '';
const STATUS_LABELS = ['Finalizado', 'En QA', 'En Progreso', 'Refinamiento', 'Bloqueado', 'Pendiente'];

// Carga issues de HF para una versión específica — sin caché, con nextPageToken
async function fetchHFByVersion(versionName) {
  if (!versionName) return [];
  const jql = `project = NT AND issuetype = "Historia Funcional" AND fixVersion = "${versionName}" AND status != Desestimado AND status != Reclasificado`;
  const fields = 'summary,status,assignee,priority,issuetype,fixVersions,labels,components,reporter,created,updated,customfield_10020';
  let all = [], pageToken = '';
  while (true) {
    const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const url = `/api/jira?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=100${tokenParam}`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.detail || data.error);
    const issues = data.issues || [];
    all = all.concat(issues);
    if (data.isLast === true || issues.length === 0 || !data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return all;
}

// Extrae versiones únicas de un array de issues
function extractVersions(issues) {
  const seen = new Set();
  const result = [];
  issues.forEach(i => {
    (i.fields?.fixVersions || []).forEach(v => {
      if (!seen.has(v.name)) { seen.add(v.name); result.push(v.name); }
    });
  });
  return result.sort();
}

export function TabHF({ onClickIssue, onClickUser }) {
  const store = useDashboardStore();

  // Issues base del JQL fijo (MVP y R1) — solo filtro de empresa, sin versión
  const mvpBase = store.getFilteredIssues('issHfMvp', true);
  const r1Base  = store.getFilteredIssues('issHfR1',  true);

  // Aplica solo el filtro de empresa sobre un array de issues
  const applyEmpresaFilter = useCallback((issues) => {
    const { activeFilter } = store;
    if (activeFilter === 'all') return issues;
    return issues.filter(i => {
      const email    = i.fields?.assignee?.emailAddress || '';
      const isPragma = email.includes('_pragma@');
      return activeFilter === 'pragma' ? isPragma : !isPragma;
    });
  }, [store.activeFilter]);

  // Versiones disponibles en el tablero activo (de todos los issues cargados)
  const allBoardIssues = useMemo(() => {
    const raw = store.rawIssues;
    return [
      ...(raw.issHfMvp || []),
      ...(raw.issHfR1  || []),
      ...(raw.issHabFront || []),
      ...(raw.issHabBack  || []),
      ...(raw.issHt  || []),
      ...(raw.issDef || []),
    ];
  }, [store.rawIssues]);

  const boardVersions = useMemo(() => extractVersions(allBoardIssues), [allBoardIssues]);

  // También incluir las versiones del store (cargadas del proyecto)
  const allVersionOptions = useMemo(() => {
    const fromBoard = new Set(boardVersions);
    const extra = (store.versions || [])
      .map(v => v.name)
      .filter(n => !fromBoard.has(n));
    return [...boardVersions, ...extra].map(n => ({ value: n, label: n }));
  }, [boardVersions, store.versions]);

  // ── Estado local de filtros de versión (sincronizado con el store) ────────
  const versionMvp = store.tabVersionFilters.hfMvp;
  const versionR1  = store.tabVersionFilters.hfR1;

  // Issues filtrados por versión local (o los del JQL si no hay filtro)
  const [mvpFiltered, setMvpFiltered] = useState(null); // null = usar mvpBase
  const [r1Filtered,  setR1Filtered]  = useState(null);
  const [loadingMvp,  setLoadingMvp]  = useState(false);
  const [loadingR1,   setLoadingR1]   = useState(false);

  // Cuando cambia el tablero en el header, resetear filtros locales
  useEffect(() => {
    store.clearTabVersionFilters();
    setMvpFiltered(null);
    setR1Filtered(null);
  }, [store.advFilters.boardId, store.advFilters.sprintId]);

  // Cargar MVP_Banca_Personas por defecto al montar el componente
  useEffect(() => {
    if (versionMvp === 'MVP_Banca_Personas' && mvpFiltered === null) {
      handleVersionMvp('MVP_Banca_Personas');
    }
  }, []);

  const handleVersionMvp = useCallback(async (ver) => {
    store.setTabVersionFilter('hfMvp', ver);
    if (!ver) { 
      setMvpFiltered(null); 
      store.setTabFilteredIssues('hfMvp', null);
      return; 
    }
    setLoadingMvp(true);
    try {
      const issues = await fetchHFByVersion(ver);
      setMvpFiltered(issues);
      store.setTabFilteredIssues('hfMvp', issues);
    } catch { 
      setMvpFiltered([]);
      store.setTabFilteredIssues('hfMvp', []);
    }
    finally { setLoadingMvp(false); }
  }, [store]);

  const handleVersionR1 = useCallback(async (ver) => {
    store.setTabVersionFilter('hfR1', ver);
    if (!ver) { 
      setR1Filtered(null);
      store.setTabFilteredIssues('hfR1', null);
      return; 
    }
    setLoadingR1(true);
    try {
      const issues = await fetchHFByVersion(ver);
      setR1Filtered(issues);
      store.setTabFilteredIssues('hfR1', issues);
    } catch { 
      setR1Filtered([]);
      store.setTabFilteredIssues('hfR1', []);
    }
    finally { setLoadingR1(false); }
  }, [store]);

  // Issues finales: si hay filtro de versión → usar los del fetch (aplicando filtro empresa)
  //                 si no → usar los del JQL base (ya filtrados por empresa)
  const mvp = useMemo(() =>
    mvpFiltered !== null ? applyEmpresaFilter(mvpFiltered) : mvpBase,
    [mvpFiltered, mvpBase, applyEmpresaFilter]
  );
  const r1 = useMemo(() =>
    r1Filtered !== null ? applyEmpresaFilter(r1Filtered) : r1Base,
    [r1Filtered, r1Base, applyEmpresaFilter]
  );

  const catMvp = useMemo(() => categorize(countByStatus(mvp)), [mvp]);
  const catR1  = useMemo(() => categorize(countByStatus(r1)),  [r1]);

  const [showCompare, setShowCompare] = useState(false);

  // ── Componente de filtro de versión ───────────────────────────────────────
  const VersionFilter = ({ value, onChange, loading, label, count }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#f5f3ff', borderRadius: 8, padding: '6px 10px',
      border: '1px solid #e0d4ff',
    }}>
      <Icon name="label" size={14} color="#7B3FE4" />
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <AutocompleteSelect
        options={allVersionOptions}
        value={value}
        onChange={onChange}
        placeholder="Todas las versiones"
        loading={loading}
        icon="label"
        emptyText="Sin versiones"
        style={{ minWidth: 180 }}
      />
      {value && (
        <span style={{
          background: '#7B3FE4', color: '#fff', borderRadius: 20,
          padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          {count} issues
        </span>
      )}
    </div>
  );

  return (
    <div>
      {/* ── Título + botón comparar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          Historias Funcionales — MVP &amp; Release 1
        </div>
        <button
          onClick={() => setShowCompare(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9,
            background: 'linear-gradient(135deg, #7B3FE4, #4A0099)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 700,
            boxShadow: '0 2px 10px rgba(123,63,228,0.3)',
            transition: 'opacity 0.15s, transform 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Icon name="compare_arrows" size={16} />
          Comparar versiones
        </button>
      </div>

      {/* ── Filtros de versión ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <VersionFilter
          label="Versión MVP"
          value={versionMvp}
          onChange={handleVersionMvp}
          loading={loadingMvp}
          count={mvp.length}
        />
        <VersionFilter
          label="Versión Release 1"
          value={versionR1}
          onChange={handleVersionR1}
          loading={loadingR1}
          count={r1.length}
        />
      </div>

      {/* ── Barras de distribución ── */}
      <div className="charts-row cols-2">
        <div style={{ position: 'relative' }}>
          {loadingMvp && <LoadingOverlay />}
          <StatusBarChart
            title={<><Icon name="bar_chart" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#7B3FE4'}}/>
              {versionMvp ? versionMvp : 'MVP'} — Distribución por Estado
            </>}
            cats={catMvp} total={mvp.length}
          />
        </div>
        <div style={{ position: 'relative' }}>
          {loadingR1 && <LoadingOverlay />}
          <StatusBarChart
            title={<><Icon name="bar_chart" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#7B3FE4'}}/>
              {versionR1 ? versionR1 : 'Release 1'} — Distribución por Estado
            </>}
            cats={catR1} total={r1.length}
          />
        </div>
      </div>

      {/* ── Tablas de desglose ── */}
      <div className="charts-row cols-2" style={{ marginTop: 24 }}>
        <StatusBreakdownTable
          title={`${versionMvp || 'MVP'} — Desglose por Estado`}
          issues={mvp}
        />
        <StatusBreakdownTable
          title={`${versionR1 || 'Release 1'} — Desglose por Estado`}
          issues={r1}
        />
      </div>

      {/* ── Comparativa ── */}
      <CompareBarChart
        title={<><Icon name="compare" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#7B3FE4'}}/>
          {versionMvp || 'MVP'} vs {versionR1 || 'Release 1'}
        </>}
        labels={STATUS_LABELS}
        groups={[
          { label: versionMvp || 'MVP', color: COLORS.purple2, data: [catMvp.done, catMvp.qa, catMvp.inProgress, catMvp.refinement, catMvp.blocked, catMvp.pending] },
          { label: versionR1  || 'R1',  color: COLORS.purple4, data: [catR1.done,  catR1.qa,  catR1.inProgress,  catR1.refinement,  catR1.blocked,  catR1.pending]  },
        ]}
      />

      {/* ── Issues detallados ── */}
      <div className="detail-table-card" style={{ marginTop: 24 }}>
        <h3>
          <Icon name="list_alt" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#4A0099'}}/>
          Issues Detallados — {versionMvp || 'MVP'}
        </h3>
        <IssueTable issues={mvp} onClickIssue={onClickIssue} onClickUser={onClickUser} />
      </div>
      <div className="detail-table-card">
        <h3>
          <Icon name="list_alt" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#4A0099'}}/>
          Issues Detallados — {versionR1 || 'Release 1'}
        </h3>
        <IssueTable issues={r1} onClickIssue={onClickIssue} onClickUser={onClickUser} />
      </div>

      {/* Modal de comparación */}
      {showCompare && (
        <VersionCompareModal
          currentVersion={versionMvp || 'MVP_Banca_Personas'}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}

// Overlay de carga sobre una card
function LoadingOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)',
      borderRadius: 16, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      color: '#7B3FE4', fontSize: '0.82rem', fontWeight: 600,
    }}>
      <div style={{ width: 20, height: 20, border: '3px solid #e0d4ff', borderTopColor: '#7B3FE4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      Cargando...
    </div>
  );
}
