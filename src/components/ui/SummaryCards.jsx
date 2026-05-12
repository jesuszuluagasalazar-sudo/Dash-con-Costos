import { useDashboardStore } from '../../store/dashboardStore';
import { categorize, countByStatus, pctNum } from '../../utils/jira';

export function SummaryCards() {
  const store = useDashboardStore();

  const hfMvp = store.getFilteredIssues('issHfMvp');
  const hfR1  = store.getFilteredIssues('issHfR1');
  const hab   = [
    ...store.getFilteredIssues('issHabFront'),
    ...store.getFilteredIssues('issHabBack'),
  ];
  const def   = store.getFilteredIssues('issDef');

  const catMvp = categorize(countByStatus(hfMvp));
  const catR1  = categorize(countByStatus(hfR1));
  const catHab = categorize(countByStatus(hab));
  const defOpen = def.filter(i => {
    const s = i.fields?.status?.name || '';
    return !['Finalizado', 'For Release', 'QA Mercantil'].includes(s);
  }).length;

  return (
    <div className="summary-grid">
      <div className="summary-card green">
        <div className="label">HF MVP Finalizadas</div>
        <div className="value">{catMvp.done}</div>
        <div className="sub">de {hfMvp.length} historias · {pctNum(catMvp.done, hfMvp.length)}%</div>
      </div>
      <div className="summary-card blue">
        <div className="label">HF R1 Finalizadas</div>
        <div className="value">{catR1.done}</div>
        <div className="sub">de {hfR1.length} historias · {pctNum(catR1.done, hfR1.length)}%</div>
      </div>
      <div className="summary-card amber">
        <div className="label">Habilitadores MVP</div>
        <div className="value">{catHab.done}</div>
        <div className="sub">de {hab.length} habilitadores</div>
      </div>
      <div className="summary-card">
        <div className="label">Defectos Abiertos</div>
        <div className="value">{defOpen}</div>
        <div className="sub">de {def.length} defectos</div>
      </div>
    </div>
  );
}
