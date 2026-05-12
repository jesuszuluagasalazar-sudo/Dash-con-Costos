import { useState, useEffect } from 'react';
import { useDashboardStore } from './store/dashboardStore';
import { Header } from './components/Header';
import { SummaryCards } from './components/ui/SummaryCards';
import { ExecutiveSummary } from './components/ui/ExecutiveSummary';
import { TabHF }  from './components/tabs/TabHF';
import { TabHab } from './components/tabs/TabHab';
import { TabHT }  from './components/tabs/TabHT';
import { TabDef } from './components/tabs/TabDef';
import { TabModificadas } from './components/tabs/TabModificadas';
import { TabCostosRentabilidad } from './components/tabs/TabCostosRentabilidad';
import { RentabilidadModal } from './components/modals/RentabilidadModal';
import { IssueModal } from './components/modals/IssueModal';
import { UserModal }  from './components/modals/UserModal';
import { Icon } from './components/ui/Icon';
import { useDragSections } from './hooks/useDragSections';

const TABS = [
  { id: 'hf',     label: 'Historias Funcionales',  icon: 'menu_book' },
  { id: 'hab',    label: 'Habilitadores',           icon: 'settings' },
  { id: 'ht',     label: 'HT Backend',              icon: 'build' },
  { id: 'def',    label: 'Defectos',                icon: 'bug_report' },
  { id: 'mej',    label: 'Mejoras',                 icon: 'auto_awesome' },
  { id: 'mod',    label: 'Modificadas',             icon: 'edit_note' },
  { id: 'costos', label: 'Costos y Rentabilidad',   icon: 'analytics' },
];

// IDs de las secciones arrastrables (orden por defecto)
const DEFAULT_SECTION_ORDER = ['summary-cards', 'executive-summary', 'tabs'];

// Etiquetas para el handle de cada sección
const SECTION_LABELS = {
  'summary-cards':     'Tarjetas de Resumen',
  'executive-summary': 'Resumen Ejecutivo',
  'tabs':              'Tablas de Issues',
};

export default function App() {
  const { loading, filterLoading, loadingMsg, error, loadDashboard } = useDashboardStore();
  const [activeTab, setActiveTab] = useState('hf');

  // Modales
  const [issueKey,         setIssueKey]         = useState(null);
  const [userModal,        setUserModal]         = useState(null);
  const [showRentabilidad, setShowRentabilidad]  = useState(false);

  // Drag & drop de secciones
  const { order, draggingId, overId, getSectionProps, resetOrder } = useDragSections(DEFAULT_SECTION_ORDER);

  useEffect(() => { loadDashboard(); }, []);

  // ── Renderizado de cada sección ──────────────────────────────────────────
  const renderSection = (id) => {
    const dragProps = getSectionProps(id);
    const isDragging = draggingId === id;
    const isOver     = overId === id && draggingId !== id;

    const wrapperStyle = {
      position: 'relative',
      opacity:  isDragging ? 0.45 : 1,
      outline:  isOver ? '2px dashed #7C3AED' : '2px dashed transparent',
      outlineOffset: 4,
      borderRadius: 14,
      transition: 'opacity 0.2s, outline 0.15s',
      marginBottom: 8,
    };

    const handleStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      marginBottom: 6,
      cursor: 'grab',
      userSelect: 'none',
      width: 'fit-content',
      borderRadius: 8,
      background: 'rgba(124,58,237,0.07)',
      border: '1px solid #EDE9FE',
      color: '#7C3AED',
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      transition: 'background 0.15s',
    };

    const handle = (
      <div style={handleStyle} title="Arrastra para reordenar">
        <span style={{ fontSize: 16, lineHeight: 1 }}>⠿</span>
        {SECTION_LABELS[id]}
      </div>
    );

    switch (id) {
      case 'summary-cards':
        return (
          <div key={id} style={wrapperStyle} {...dragProps}>
            {handle}
            <SummaryCards />
          </div>
        );

      case 'rentabilidad-btn':
        return null;

      case 'executive-summary':
        return (
          <div key={id} style={wrapperStyle} {...dragProps}>
            {handle}
            <ExecutiveSummary />
          </div>
        );

      case 'tabs':
        return (
          <div key={id} style={wrapperStyle} {...dragProps}>
            {handle}
            <nav className="tabs-nav" role="tablist">
              {TABS.map(t => (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <Icon name={t.icon} size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {t.label}
                </button>
              ))}
            </nav>

            <div className={`tab-panel${activeTab === 'hf'  ? ' active' : ''}`} id="panel-hf">
              <TabHF
                onClickIssue={key => setIssueKey(key)}
                onClickUser={(id, name, av) => setUserModal({ accountId: id, displayName: name, avatarUrl: av })}
              />
            </div>
            <div className={`tab-panel${activeTab === 'hab' ? ' active' : ''}`} id="panel-hab">
              <TabHab
                onClickIssue={key => setIssueKey(key)}
                onClickUser={(id, name, av) => setUserModal({ accountId: id, displayName: name, avatarUrl: av })}
              />
            </div>
            <div className={`tab-panel${activeTab === 'ht'  ? ' active' : ''}`} id="panel-ht">
              <TabHT
                onClickIssue={key => setIssueKey(key)}
                onClickUser={(id, name, av) => setUserModal({ accountId: id, displayName: name, avatarUrl: av })}
              />
            </div>
            <div className={`tab-panel${activeTab === 'def' ? ' active' : ''}`} id="panel-def">
              <TabDef
                onClickIssue={key => setIssueKey(key)}
                onClickUser={(id, name, av) => setUserModal({ accountId: id, displayName: name, avatarUrl: av })}
              />
            </div>
            <div className={`tab-panel${activeTab === 'mej' ? ' active' : ''}`} id="panel-mej">
              <div className="empty-state">
                <Icon name="rocket_launch" size={48} color="#c4b5fd" style={{ display: 'block', margin: '0 auto 12px' }} />
                <p>Mejoras — próximamente</p>
              </div>
            </div>
            <div className={`tab-panel${activeTab === 'mod' ? ' active' : ''}`} id="panel-mod">
              <TabModificadas
                onClickIssue={key => setIssueKey(key)}
                onClickUser={(id, name, av) => setUserModal({ accountId: id, displayName: name, avatarUrl: av })}
              />
            </div>
            <div className={`tab-panel${activeTab === 'costos' ? ' active' : ''}`} id="panel-costos">
              <TabCostosRentabilidad />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Loading overlay */}
      {loading && (
        <div id="loading-overlay">
          <div className="spinner" />
          <p>{loadingMsg || 'Consultando Jira...'}</p>
        </div>
      )}

      {/* Filter loader */}
      {!loading && filterLoading && (
        <div id="filter-loader">
          <div className="filter-loader-spinner" />
          <span>{loadingMsg || 'Cargando...'}</span>
        </div>
      )}

      <Header />

      <main>
        {/* Error */}
        {error && (
          <div className="error-box">
            <strong>⚠️ Error al consultar Jira:</strong> {error}
            <br /><small>Asegúrate de que las variables de entorno estén configuradas correctamente.</small>
          </div>
        )}

        {/* Barra de control del layout */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, padding: '6px 12px',
          background: 'rgba(124,58,237,0.05)',
          border: '1px solid #EDE9FE',
          borderRadius: 10,
        }}>
          <span style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600 }}>
            <span style={{ marginRight: 6 }}>⠿</span>
            Arrastra las secciones para reorganizar el dashboard
          </span>
          <button
            onClick={resetOrder}
            title="Restaurar orden por defecto"
            style={{
              fontSize: '0.72rem', fontWeight: 700, color: '#7C3AED',
              background: 'none', border: '1px solid #DDD6FE',
              borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
            }}
          >
            Restablecer orden
          </button>
        </div>

        {/* Secciones arrastrables */}
        {order.map(id => renderSection(id))}
      </main>

      <footer>
        Kairós Dashboard · Proyecto NT · Mercantil Panamá · Pragma · {new Date().getFullYear()}
      </footer>

      {/* Modales */}
      {issueKey && (
        <IssueModal
          issueKey={issueKey}
          onClose={() => setIssueKey(null)}
          onClickUser={(id, name, av) => {
            setIssueKey(null);
            setUserModal({ accountId: id, displayName: name, avatarUrl: av });
          }}
        />
      )}
      {userModal && (
        <UserModal
          {...userModal}
          onClose={() => setUserModal(null)}
          onClickIssue={key => { setUserModal(null); setIssueKey(key); }}
        />
      )}
      {showRentabilidad && (
        <RentabilidadModal onClose={() => setShowRentabilidad(false)} />
      )}
    </>
  );
}
