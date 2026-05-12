import { useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { categorize, countByStatus, pctNum, COLORS } from '../../utils/jira';
import { IssueTable } from '../ui/IssueTable';
import { StatusBarChart, CompareBarChart } from '../ui/StatusBarChart';
import { Icon } from '../ui/Icon';

const STATUS_LABELS = ['Finalizado', 'En QA', 'En Progreso', 'Refinamiento', 'Bloqueado', 'Pendiente'];

export function TabHab({ onClickIssue, onClickUser }) {
  const store = useDashboardStore();
  const front = store.getFilteredIssues('issHabFront');
  const back  = store.getFilteredIssues('issHabBack');

  const catFront = useMemo(() => categorize(countByStatus(front)), [front]);
  const catBack  = useMemo(() => categorize(countByStatus(back)),  [back]);

  const totalCat = {
    done:       catFront.done       + catBack.done,
    qa:         catFront.qa         + catBack.qa,
    inProgress: catFront.inProgress + catBack.inProgress,
    refinement: catFront.refinement + catBack.refinement,
    blocked:    catFront.blocked    + catBack.blocked,
    pending:    catFront.pending    + catBack.pending,
  };
  const total = front.length + back.length;

  const KpiCard = ({ cls, val, lbl }) => (
    <div className={`kpi-card ${cls}`}>
      <div className="kpi-val">{val}</div>
      <div className="kpi-lbl">{lbl}</div>
    </div>
  );

  const Row = ({ label, cat, rowTotal }) => (
    <tr>
      <td>{label}</td>
      <td>{rowTotal}</td>
      <td>{cat.done}</td>
      <td>{cat.qa}</td>
      <td>{cat.inProgress}</td>
      <td>{cat.refinement}</td>
      <td>{cat.blocked || 0}</td>
      <td>{cat.pending}</td>
      <td>
        <div className="prog-bar-wrap">
          <div className="prog-bar" style={{ width: `${pctNum(cat.done, rowTotal)}%` }} />
        </div>
        <span style={{ fontSize: '0.75rem', color: '#4A0099' }}>{pctNum(cat.done, rowTotal)}%</span>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="section-title">Habilitadores — MVP</div>

      <div className="kpi-strip cols-5" style={{ marginBottom: 20 }}>
        <KpiCard cls="done" val={totalCat.done}       lbl="Finalizado" />
        <KpiCard cls="qa"   val={totalCat.qa}         lbl="En QA" />
        <KpiCard cls="prog" val={totalCat.inProgress} lbl="En Progreso" />
        <KpiCard cls="ref"  val={totalCat.refinement} lbl="Refinamiento" />
        <KpiCard cls="pend" val={totalCat.pending}    lbl="Pendiente" />
      </div>

      <div className="charts-row cols-2">
        <StatusBarChart
          title={<><Icon name="bar_chart" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#7B3FE4'}}/>Front — Distribución por Estado</>}
          cats={catFront} total={front.length}
        />
        <StatusBarChart
          title={<><Icon name="bar_chart" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#7B3FE4'}}/>Back — Distribución por Estado</>}
          cats={catBack} total={back.length}
        />
      </div>

      <div className="table-card">
        <h3>Desglose por Estado</h3>
        <table>
          <thead>
            <tr>
              <th>Tipo</th><th>Total</th><th>Finalizado</th><th>En QA</th>
              <th>En Progreso</th><th>Refinamiento</th><th>Bloqueado</th><th>Pendiente</th><th>% Avance</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Habilitador Front" cat={catFront} rowTotal={front.length} />
            <Row label="Habilitador Back"  cat={catBack}  rowTotal={back.length}  />
          </tbody>
        </table>
      </div>

      <CompareBarChart
        title={<><Icon name="compare" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#7B3FE4'}}/>Front vs Back — Comparativa</>}
        labels={STATUS_LABELS}
        groups={[
          { label: 'Front', color: COLORS.purple3, data: [catFront.done, catFront.qa, catFront.inProgress, catFront.refinement, catFront.blocked||0, catFront.pending] },
          { label: 'Back',  color: COLORS.purple4, data: [catBack.done,  catBack.qa,  catBack.inProgress,  catBack.refinement,  catBack.blocked||0,  catBack.pending]  },
        ]}
      />

      <div className="detail-table-card" style={{ marginTop: 24 }}>
        <h3><Icon name="list_alt" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#4A0099'}}/>Issues Detallados — Habilitador Front</h3>
        <IssueTable issues={front} onClickIssue={onClickIssue} onClickUser={onClickUser} />
      </div>
      <div className="detail-table-card">
        <h3><Icon name="list_alt" size={16} style={{marginRight:6,verticalAlign:'middle',color:'#4A0099'}}/>Issues Detallados — Habilitador Back</h3>
        <IssueTable issues={back} onClickIssue={onClickIssue} onClickUser={onClickUser} />
      </div>
    </div>
  );
}
