import { useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { categorize, countByStatus, pctNum } from '../../utils/jira';
import { IssueTable } from '../ui/IssueTable';
import { StatusBarChart } from '../ui/StatusBarChart';

import { Icon } from '../ui/Icon';

export function TabHT({ onClickIssue, onClickUser }) {
  const store  = useDashboardStore();
  const issues = store.getFilteredIssues('issHt');

  const counts = useMemo(() => countByStatus(issues), [issues]);
  const cat    = useMemo(() => categorize(counts), [counts]);
  const total  = issues.length;

  const statusLabels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  const KpiCard = ({ cls, val, lbl }) => (
    <div className={`kpi-card ${cls}`}>
      <div className="kpi-val">{val}</div>
      <div className="kpi-lbl">{lbl}</div>
    </div>
  );

  return (
    <div>
      <div className="section-title">HT Backend — MVP</div>

      <div className="kpi-strip cols-5" style={{ marginBottom: 20 }}>
        <KpiCard cls="done" val={cat.done}       lbl="Finalizado" />
        <KpiCard cls="qa"   val={cat.qa}         lbl="En QA" />
        <KpiCard cls="prog" val={cat.inProgress} lbl="En Progreso" />
        <KpiCard cls="ref"  val={cat.refinement} lbl="Refinamiento" />
        <KpiCard cls="pend" val={cat.pending}    lbl="Pendiente" />
      </div>

      <StatusBarChart title={<><Icon name="bar_chart" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#7B3FE4'}}/>Distribución por Estado</>} cats={cat} total={total} />

      <div className="table-card" style={{ marginTop: 24 }}>
        <h3>Desglose por Estado</h3>
        <table>
          <thead><tr><th>Estado</th><th>Cantidad</th><th>% del Total</th><th>Barra</th></tr></thead>
          <tbody>
            {statusLabels.map(s => (
              <tr key={s}>
                <td>{s}</td>
                <td>{counts[s]}</td>
                <td>{pctNum(counts[s], total)}%</td>
                <td style={{ minWidth: 120 }}>
                  <div className="prog-bar-wrap">
                    <div className="prog-bar" style={{ width: `${pctNum(counts[s], total)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="detail-table-card">
        <h3><Icon name="list_alt" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#4A0099'}}/>Issues Detallados — HT Backend</h3>
        <IssueTable issues={issues} onClickIssue={onClickIssue} onClickUser={onClickUser} />
      </div>
    </div>
  );
}
