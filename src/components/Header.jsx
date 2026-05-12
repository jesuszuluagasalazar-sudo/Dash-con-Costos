import { useDashboardStore } from '../store/dashboardStore';
import { Icon } from './ui/Icon';
import { AutocompleteSelect } from './ui/AutocompleteSelect';

const TABS = [
  { id: 'resumen', label: 'Resumen Ejecutivo',      icon: 'dashboard' },
  { id: 'hf',      label: 'Historias Funcionales',  icon: 'menu_book' },
  { id: 'hab',     label: 'Habilitadores',          icon: 'settings' },
  { id: 'ht',      label: 'HT Backend',             icon: 'build' },
  { id: 'def',     label: 'Defectos',               icon: 'bug_report' },
  { id: 'mej',     label: 'Mejoras',                icon: 'auto_awesome' },
  { id: 'mod',     label: 'Modificadas',            icon: 'edit_note' },
  { id: 'costos',  label: 'Costos y Rentabilidad',  icon: 'analytics' },
];

export function Header({ activeTab, onTabChange }) {
  const {
    activeFilter, setActiveFilter,
    lastUpdated,
    boards, boardsCache, versions,
    advFilters, setAdvFilters, clearAdvFilters,
    loadBoardSprints, loadBoardIssues, restoreBaseIssues,
    filterLoading,
  } = useDashboardStore();

  const toggleFilter = (empresa) => {
    setActiveFilter(activeFilter === empresa ? 'all' : empresa);
  };

  // ── Opciones para los autocomplete ──────────────────────────────────────

  const boardOptions = boards.map(b => ({
    value: String(b.id),
    label: b.name,
    meta:  b.type === 'scrum' ? 'Scrum' : b.type === 'kanban' ? 'Kanban' : '',
  }));

  const sprintOptions = (boardsCache[advFilters.boardId]?.sprints || [])
    .sort((a, b) =>
      ({ active: 0, future: 1, closed: 2 }[a.state] ?? 3) -
      ({ active: 0, future: 1, closed: 2 }[b.state] ?? 3) || b.id - a.id
    )
    .map(s => ({
      value: String(s.id),
      label: s.name,
      meta:  s.state === 'active' ? 'Activo' : s.state === 'future' ? 'Futuro' : 'Cerrado',
      dot:   s.state === 'active' ? '#22c55e' : s.state === 'future' ? '#3b82f6' : '#94a3b8',
    }));

  // Versiones: mostrar solo las más relevantes primero (no archivadas)
  const versionOptions = versions.map(v => ({
    value: v.name,
    label: v.name,
    meta:  v.released ? 'Liberada' : v.overdue ? 'Vencida' : '',
  }));

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleBoardChange = async (boardId) => {
    setAdvFilters({ boardId, sprintId: '', sprintName: '', version: '' });
    if (!boardId) { restoreBaseIssues(); return; }
    await loadBoardSprints(boardId);
    await loadBoardIssues(boardId, '');
  };

  const handleSprintChange = async (sprintId, opt) => {
    setAdvFilters({ sprintId, sprintName: opt?.label || '' });
    if (advFilters.boardId) {
      await loadBoardIssues(advFilters.boardId, sprintId);
    }
  };

  const handleVersionChange = (version) => {
    setAdvFilters({ version });
  };

  // Chips de filtros activos
  const activeChips = [];
  if (advFilters.boardId) {
    const b = boards.find(x => String(x.id) === advFilters.boardId);
    activeChips.push({ key: 'board', label: b?.name || advFilters.boardId });
  }
  if (advFilters.sprintId && advFilters.sprintName) {
    activeChips.push({ key: 'sprint', label: advFilters.sprintName });
  }
  if (advFilters.version) {
    activeChips.push({ key: 'version', label: advFilters.version });
  }
  if (advFilters.createdFrom || advFilters.createdTo) {
    activeChips.push({ key: 'date', label: `${advFilters.createdFrom || '…'} → ${advFilters.createdTo || '…'}` });
  }

  return (
    <>
      {/* ── Header principal ── */}
      <header>
        <div className="header-logos">
          <button
            className={`filter-btn filter-btn-mercantil${activeFilter === 'all' || activeFilter === 'mercantil' ? ' active' : ''}`}
            onClick={() => toggleFilter('mercantil')}
            title="Ver solo issues de Mercantil"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px' }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Mercantil_Servicios_Financieros_logo.svg/200px-Mercantil_Servicios_Financieros_logo.svg.png"
              alt="Mercantil"
              style={{ height: 22, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }}
            />
            <span style={{ display: 'none' }}>Mercantil</span>
          </button>

          <span className="filter-sep">|</span>

          <button
            className={`filter-btn filter-btn-pragma${activeFilter === 'all' || activeFilter === 'pragma' ? ' active' : ''}`}
            onClick={() => toggleFilter('pragma')}
            title="Ver solo issues de Pragma"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px' }}
          >
            <img
              src="https://www.pragma.com.co/hubfs/pragma-logo.svg"
              alt="Pragma"
              style={{
                height: 22, objectFit: 'contain',
                filter: activeFilter === 'all' || activeFilter === 'pragma'
                  ? 'brightness(0) invert(1)' : 'none',
                transition: 'filter 0.2s',
              }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }}
            />
            <span style={{ display: 'none' }}>Pragma</span>
          </button>
        </div>

        <div className="header-title">
          <h1>◆ Kairós - Avance del Proyecto</h1>
          <p>
            Tablero: Delivery PN · Fuente: Jira NT · Actualizado:{' '}
            <span id="last-updated">
              {lastUpdated
                ? lastUpdated.toLocaleString('es-PA', { dateStyle: 'medium', timeStyle: 'short' })
                : 'cargando...'}
            </span>
          </p>
        </div>

        <div className="header-right">
          <div>Sprint activo</div>
          <div style={{ fontWeight: 700, color: '#2D0066' }}>
            {advFilters.sprintName || '—'}
          </div>
        </div>
      </header>

      {/* ── Barra de filtros avanzados ── */}
      <div id="advanced-filter-bar">

        {/* Tablero */}
        <div className="adv-filter-group">
          <span className="adv-filter-label">
            <Icon name="dashboard" size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Tablero
          </span>
          <AutocompleteSelect
            options={boardOptions}
            value={advFilters.boardId}
            onChange={handleBoardChange}
            placeholder="Buscar tablero..."
            icon="dashboard"
            emptyText="Sin tableros"
            style={{ minWidth: 200 }}
          />
        </div>

        <span className="adv-filter-sep">|</span>

        {/* Sprint */}
        <div className="adv-filter-group">
          <span className="adv-filter-label">
            <Icon name="directions_run" size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Sprint
          </span>
          <AutocompleteSelect
            options={sprintOptions}
            value={advFilters.sprintId}
            onChange={handleSprintChange}
            placeholder={advFilters.boardId ? 'Buscar sprint...' : 'Selecciona un tablero'}
            disabled={!advFilters.boardId}
            loading={filterLoading && !!advFilters.boardId && !sprintOptions.length}
            icon="directions_run"
            emptyText="Sin sprints"
            style={{ minWidth: 200 }}
          />
        </div>

        <span className="adv-filter-sep">|</span>

        {/* Fecha de creación */}
        <div className="adv-filter-group">
          <span className="adv-filter-label">
            <Icon name="calendar_today" size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Creado
          </span>
          <input type="date" className="adv-filter-date"
            value={advFilters.createdFrom}
            onChange={e => setAdvFilters({ createdFrom: e.target.value })} />
          <span className="adv-filter-sep">—</span>
          <input type="date" className="adv-filter-date"
            value={advFilters.createdTo}
            onChange={e => setAdvFilters({ createdTo: e.target.value })} />
        </div>

        {/* Limpiar */}
        {activeChips.length > 0 && (
          <button className="adv-filter-clear" onClick={clearAdvFilters}>
            <Icon name="close" size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Limpiar
          </button>
        )}

        {/* Chips activos */}
        {activeChips.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto', alignItems: 'center' }}>
            {activeChips.map(chip => (
              <span key={chip.key} className="adv-chip">
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs de navegación ── */}
      <nav className="tabs-nav" role="tablist" style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100,
        background: '#fff',
        borderBottom: '2px solid #EDE9FE',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            <Icon name={t.icon} size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}
