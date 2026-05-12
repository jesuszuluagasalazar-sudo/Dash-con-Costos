import { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from '../ui/Badge';
import { formatDate, STATUS_DONE, STATUS_QA, STATUS_IN_PROGRESS, STATUS_REFINEMENT } from '../../utils/jira';

const API = '';

export function UserModal({ accountId, displayName, avatarUrl, onClose, onClickIssue }) {
  const [state, setState] = useState({ loading: true, user: null, issues: [], activity: null, error: null });

  const load = useCallback(async () => {
    if (!accountId) return;
    setState({ loading: true, user: null, issues: [], activity: null, error: null });
    try {
      const [uRes, iRes, aRes] = await Promise.all([
        fetch(`${API}/api/user?accountId=${encodeURIComponent(accountId)}`),
        fetch(`${API}/api/user-issues?accountId=${encodeURIComponent(accountId)}&maxResults=50`),
        fetch(`${API}/api/user-activity?accountId=${encodeURIComponent(accountId)}`),
      ]);
      const user     = uRes.ok ? await uRes.json() : {};
      const issData  = iRes.ok ? await iRes.json() : { issues: [] };
      const actData  = aRes.ok ? await aRes.json() : { issues: [] };
      setState({ loading: false, user, issues: issData.issues || [], activity: actData.issues?.[0] || null, error: null });
    } catch (err) {
      setState({ loading: false, user: null, issues: [], activity: null, error: err.message });
    }
  }, [accountId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  if (!accountId) return null;

  const { user, issues, activity } = state;
  const name   = user?.displayName || displayName || '—';
  const email  = user?.emailAddress || '—';
  const active = user?.active !== false;
  const avatar = user?.avatarUrls?.['48x48'] || avatarUrl || '';

  const kpis = { done: 0, qa: 0, inProgress: 0, refinement: 0, pending: 0 };
  issues.forEach(i => {
    const s = i.fields?.status?.name || '';
    if (STATUS_DONE.includes(s))             kpis.done++;
    else if (STATUS_QA.includes(s))          kpis.qa++;
    else if (STATUS_IN_PROGRESS.includes(s)) kpis.inProgress++;
    else if (STATUS_REFINEMENT.includes(s))  kpis.refinement++;
    else kpis.pending++;
  });

  return (
    <div
      id="user-modal-overlay"
      className="open"
      onClick={e => e.target.id === 'user-modal-overlay' && onClose()}
    >
      <div id="user-modal">
        <div className="umodal-header">
          <div id="umodal-avatar-wrap">
            {avatar
              ? <img className="umodal-avatar" src={avatar} alt={name} onError={e => { e.target.style.display = 'none'; }} />
              : <div className="umodal-avatar-placeholder">{name[0]?.toUpperCase()}</div>}
          </div>
          <div className="umodal-info">
            <div className="umodal-name">{name}</div>
            <div className="umodal-email">{email}</div>
            <div className="umodal-meta">
              <span className={`umodal-badge ${active ? 'active' : 'inactive'}`}>{active ? '✅ Activo' : '⛔ Inactivo'}</span>
              {user?.timeZone && <span className="umodal-badge">🌍 {user.timeZone}</span>}
            </div>
          </div>
          <button className="umodal-close" onClick={onClose}>✕</button>
        </div>

        {state.loading ? (
          <div className="umodal-loading"><div className="umodal-spinner" /><span>Consultando Jira...</span></div>
        ) : (
          <div className="umodal-body">
            {/* Último acceso */}
            <div>
              <div className="umodal-section-title">🕐 Última actividad</div>
              {activity ? (
                <div className="umodal-last-access">
                  <div className="la-icon">🕐</div>
                  <div className="la-info">
                    <div className="la-label">Última actividad en Jira</div>
                    <div className="la-value">{formatDate(activity.fields?.updated)}</div>
                    <div className="la-sub">
                      Último issue:{' '}
                      <span style={{ cursor: 'pointer', color: '#4A0099', fontWeight: 700 }}
                        onClick={() => { onClose(); onClickIssue?.(activity.key); }}>
                        {activity.key}
                      </span>{' '}— {activity.fields?.summary?.slice(0, 60)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="umodal-last-access">
                  <div className="la-icon">🕐</div>
                  <div className="la-info">
                    <div className="la-label">Última actividad</div>
                    <div className="la-value" style={{ color: '#aaa' }}>Sin actividad registrada</div>
                  </div>
                </div>
              )}
            </div>

            {/* KPIs */}
            <div>
              <div className="umodal-section-title">📊 Resumen ({issues.length} issues)</div>
              <div className="umodal-kpis">
                {[
                  { cls: 'done', val: kpis.done,       lbl: 'Finalizado' },
                  { cls: 'qa',   val: kpis.qa,         lbl: 'En QA' },
                  { cls: 'prog', val: kpis.inProgress, lbl: 'En Progreso' },
                  { cls: 'ref',  val: kpis.refinement, lbl: 'Refinamiento' },
                  { cls: 'pend', val: kpis.pending,    lbl: 'Pendiente' },
                ].map(k => (
                  <div key={k.cls} className={`umodal-kpi ${k.cls}`}>
                    <div className="kv">{k.val}</div>
                    <div className="kl">{k.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            <div>
              <div className="umodal-section-title">📋 Issues asignados</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="umodal-issues-table">
                  <thead><tr><th>Clave</th><th>Título</th><th>Estado</th><th>Prioridad</th><th>Actualizado</th></tr></thead>
                  <tbody>
                    {issues.length === 0
                      ? <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: '24px' }}>Sin issues</td></tr>
                      : issues.map(i => (
                        <tr key={i.key}>
                          <td>
                            <span className="umodal-issue-key"
                              onClick={() => { onClose(); onClickIssue?.(i.key); }}>
                              {i.key}
                            </span>
                          </td>
                          <td className="umodal-issue-summary"><span title={i.fields?.summary}>{i.fields?.summary}</span></td>
                          <td><StatusBadge status={i.fields?.status?.name} /></td>
                          <td>{i.fields?.priority?.name || '—'}</td>
                          <td className="cl-date">{formatDate(i.fields?.updated)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <a href={`https://mercantilpanama.atlassian.net/jira/people/${accountId}`}
              target="_blank" rel="noopener noreferrer" className="umodal-jira-link">
              🔗 Ver perfil en Jira
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
