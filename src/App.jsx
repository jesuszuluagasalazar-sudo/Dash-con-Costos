import { useState, useEffect } from 'react';
import { useDashboardStore } from './store/dashboardStore';
import { Header } from './components/Header';
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

export default function App() {
  const { loading, filterLoading, loadingMsg, error, loadDashboard } = useDashboardStore();
  const [activeTab, setActiveTab] = useState('resumen');

  // Modales
  const [issueKey,         setIssueKey]         = useState(null);
  const [userModal,        setUserModal]         = useState(null);
  const [showRentabilidad, setShowRentabilidad]  = useState(false);

  useEffect(() => { loadDashboard(); }, []);

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

      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {/* Error */}
        {error && (
          <div className="error-box">
            <strong>⚠️ Error al consultar Jira:</strong> {error}
            <br /><small>Asegúrate de que las variables de entorno estén configuradas correctamente.</small>
          </div>
        )}

        {/* Tab: Resumen Ejecutivo */}
        <div className={`tab-panel${activeTab === 'resumen' ? ' active' : ''}`} id="panel-resumen">
          <ExecutiveSummary />
        </div>

        {/* Tab: Historias Funcionales */}
        <div className={`tab-panel${activeTab === 'hf' ? ' active' : ''}`} id="panel-hf">
          <TabHF
            onClickIssue={key => setIssueKey(key)}
            onClickUser={(id, name, av) => setUserModal({ accountId: id, displayName: name, avatarUrl: av })}
          />
        </div>

        {/* Tab: Habilitadores */}
        <div className={`tab-panel${activeTab === 'hab' ? ' active' : ''}`} id="panel-hab">
          <TabHab
            onClickIssue={key => setIssueKey(key)}
            onClickUser={(id, name, av) => setUserModal({ accountId: id, displayName: name, avatarUrl: av })}
          />
        </div>

        {/* Tab: HT Backend */}
        <div className={`tab-panel${activeTab === 'ht' ? ' active' : ''}`} id="panel-ht">
          <TabHT
            onClickIssue={key => setIssueKey(key)}
            onClickUser={(id, name, av) => setUserModal({ accountId: id, displayName: name, avatarUrl: av })}
          />
        </div>

        {/* Tab: Defectos */}
        <div className={`tab-panel${activeTab === 'def' ? ' active' : ''}`} id="panel-def">
          <TabDef
            onClickIssue={key => setIssueKey(key)}
            onClickUser={(id, name, av) => setUserModal({ accountId: id, displayName: name, avatarUrl: av })}
          />
        </div>

        {/* Tab: Mejoras */}
        <div className={`tab-panel${activeTab === 'mej' ? ' active' : ''}`} id="panel-mej">
          <div className="empty-state">
            <Icon name="rocket_launch" size={48} color="#c4b5fd" style={{ display: 'block', margin: '0 auto 12px' }} />
            <p>Mejoras — próximamente</p>
          </div>
        </div>

        {/* Tab: Modificadas */}
        <div className={`tab-panel${activeTab === 'mod' ? ' active' : ''}`} id="panel-mod">
          <TabModificadas
            onClickIssue={key => setIssueKey(key)}
            onClickUser={(id, name, av) => setUserModal({ accountId: id, displayName: name, avatarUrl: av })}
          />
        </div>

        {/* Tab: Costos y Rentabilidad */}
        <div className={`tab-panel${activeTab === 'costos' ? ' active' : ''}`} id="panel-costos">
          <TabCostosRentabilidad />
        </div>
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
