import { useState, useEffect, useCallback } from 'react';
import { StatusBadge, PriorityIcon } from '../ui/Badge';
import { AssigneeCell } from '../ui/AssigneeCell';
import { formatDate, escHtml } from '../../utils/jira';

const API = '';

import { Icon } from '../ui/Icon';

export function IssueModal({ issueKey, onClose, onClickUser }) {
  const [state, setState] = useState({ loading: true, issue: null, changelog: null, error: null });

  const load = useCallback(async () => {
    if (!issueKey) return;
    setState({ loading: true, issue: null, changelog: null, error: null });
    try {
      const [iRes, cRes] = await Promise.all([
        fetch(`${API}/api/issue?key=${encodeURIComponent(issueKey)}&fields=summary,status,assignee,issuetype,fixVersions,priority,labels,components,reporter,created,updated,description`),
        fetch(`${API}/api/changelog?key=${encodeURIComponent(issueKey)}&maxResults=100`),
      ]);
      const issue     = iRes.ok  ? await iRes.json()  : null;
      const changelog = cRes.ok  ? await cRes.json()  : { values: [] };
      setState({ loading: false, issue, changelog, error: null });
    } catch (err) {
      setState({ loading: false, issue: null, changelog: null, error: err.message });
    }
  }, [issueKey]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!issueKey) return null;

  const f = state.issue?.fields || {};

  return (
    <div
      id="issue-modal-overlay"
      className="open"
      onClick={e => e.target.id === 'issue-modal-overlay' && onClose()}
    >
      <div id="issue-modal">
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-key-row">
              <span className="modal-key-badge">{issueKey}</span>
              {f.issuetype?.name && <span className="modal-type-badge">{f.issuetype.name}</span>}
            </div>
            <div className="modal-title" id="modal-issue-title">
              {state.loading ? 'Cargando...' : (f.summary || '—')}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div id="modal-body-content">
          {state.loading && (
            <div className="modal-loading">
              <div className="modal-spinner" />
              <span>Consultando Jira...</span>
            </div>
          )}
          {state.error && (
            <div className="modal-body">
              <div className="modal-error-msg">⚠️ {state.error}</div>
            </div>
          )}
          {!state.loading && !state.error && state.issue && (
            <div className="modal-body">
              {/* Campos */}
              <div className="modal-fields">
                {[
                  { label: 'Estado',        node: <StatusBadge status={f.status?.name} /> },
                  { label: 'Prioridad',     node: <><PriorityIcon priority={f.priority} />{f.priority?.name || '—'}</> },
                  { label: 'Asignado a',    node: <AssigneeCell assignee={f.assignee} onClickUser={(id, n, av) => { onClose(); onClickUser?.(id, n, av); }} /> },
                  { label: 'Reportado por', node: f.reporter?.displayName || '—' },
                  { label: 'Versión Fix',   node: (f.fixVersions || []).map(v => v.name).join(', ') || '—' },
                  { label: 'Componentes',   node: (f.components  || []).map(c => c.name).join(', ') || '—' },
                  { label: 'Etiquetas',     node: (f.labels      || []).join(', ') || '—' },
                  { label: 'Creado',        node: formatDate(f.created) },
                  { label: 'Actualizado',   node: formatDate(f.updated) },
                ].map(({ label, node }) => (
                  <div key={label} className="modal-field">
                    <div className="mf-label">{label}</div>
                    <div className="mf-value">{node}</div>
                  </div>
                ))}
              </div>

              {/* Flujo de trabajo */}
              <div>
                <div className="modal-section-title">
                  <Icon name="account_tree" size={16} style={{marginRight:6,verticalAlign:'middle'}}/>
                  Flujo de trabajo
                </div>
                <WorkflowTimeline fields={f} changelog={state.changelog} />
              </div>

              {/* Historial */}
              <div>
                <div className="modal-section-title">
                  <Icon name="history" size={16} style={{marginRight:6,verticalAlign:'middle'}}/>
                  Historial de cambios
                </div>
                <ChangelogSection issueKey={issueKey} changelog={state.changelog} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <a
            href={`https://mercantilpanama.atlassian.net/browse/${issueKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-jira-link"
          >          <Icon name="open_in_new" size={16} style={{marginRight:6,verticalAlign:'middle'}}/>
            Ver en Jira</a>
        </div>
      </div>
    </div>
  );
}

function WorkflowTimeline({ fields, changelog }) {
  const allValues = changelog?.values || [];
  const transitions = [];
  allValues.forEach(entry => {
    (entry.items || []).forEach(item => {
      if (item.field === 'status') {
        transitions.push({
          from:   item.fromString || '—',
          to:     item.toString   || '—',
          author: entry.author?.displayName || 'Sistema',
          date:   entry.created || '',
        });
      }
    });
  });
  transitions.sort((a, b) => new Date(a.date) - new Date(b.date));

  const currentStatus = fields?.status?.name || '—';

  if (!transitions.length) {
    return (
      <div className="workflow-timeline">
        <div className="wf-step current">
          <div className="wf-dot-wrap"><div className="wf-dot" /></div>
          <div className="wf-content">
            <div className="wf-card">
              <div className="wf-status-row">
                <span className="wf-status-name">{currentStatus}</span>
                <span className="wf-current-chip">● ACTUAL</span>
              </div>
              <div className="wf-meta"><span className="wf-initial-label">Sin historial de transiciones</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { status: transitions[0].from, author: null, date: null, isCurrent: false, isDone: true },
    ...transitions.map((t, idx) => ({
      status: t.to, author: t.author, date: t.date,
      isCurrent: idx === transitions.length - 1,
      isDone: idx < transitions.length - 1,
    })),
  ];

  return (
    <div className="workflow-timeline">
      {steps.map((step, idx) => (
        <div key={idx} className={`wf-step${step.isCurrent ? ' current' : step.isDone ? ' done-step' : ''}`}>
          <div className="wf-dot-wrap"><div className="wf-dot" /></div>
          <div className="wf-content">
            <div className="wf-card">
              <div className="wf-status-row">
                <span className="wf-status-name">{step.status}</span>
                {step.isCurrent && <span className="wf-current-chip">● ACTUAL</span>}
              </div>
              <div className="wf-meta">
                {step.author
                  ? <><span className="wf-meta-author">{step.author}</span><span className="wf-meta-date">{formatDate(step.date)}</span></>
                  : <span className="wf-initial-label">Estado inicial</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChangelogSection({ issueKey, changelog }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const allValues = changelog?.values || [];
  let rows = [];
  allValues.forEach(entry => {
    const author  = entry.author?.displayName || 'Sistema';
    const date    = entry.created || '';
    const dateObj = date ? new Date(date) : null;
    (entry.items || []).forEach(item => {
      rows.push({ field: item.field || '—', fromVal: item.fromString || '', toVal: item.toString || '', author, date, dateObj });
    });
  });
  rows.sort((a, b) => (b.dateObj || 0) - (a.dateObj || 0));

  const allDates = rows.filter(r => r.dateObj).map(r => r.dateObj);
  const minStr   = allDates.length ? new Date(Math.min(...allDates)).toISOString().slice(0, 10) : '';
  const maxStr   = allDates.length ? new Date(Math.max(...allDates)).toISOString().slice(0, 10) : '';

  let filtered = rows;
  if (dateFrom) { const f = new Date(dateFrom + 'T00:00:00'); filtered = filtered.filter(r => r.dateObj && r.dateObj >= f); }
  if (dateTo)   { const t = new Date(dateTo   + 'T23:59:59'); filtered = filtered.filter(r => r.dateObj && r.dateObj <= t); }

  return (
    <>
      <div className="changelog-filter-bar">
        <label>Desde</label>
        <input type="date" className="changelog-date-input" value={dateFrom} min={minStr} max={maxStr} onChange={e => setDateFrom(e.target.value)} />
        <span className="changelog-filter-sep">—</span>
        <label>Hasta</label>
        <input type="date" className="changelog-date-input" value={dateTo} min={minStr} max={maxStr} onChange={e => setDateTo(e.target.value)} />
        <button className="changelog-clear-btn" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕ Limpiar</button>
        <span className="changelog-count">{filtered.length} de {rows.length} cambio{rows.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="changelog-list">
        {filtered.length === 0
          ? <div className="changelog-empty">Sin cambios en el rango seleccionado</div>
          : filtered.map((r, idx) => (
            <div key={idx} className="changelog-item">
              <div className="cl-field-wrap">
                <span className="cl-field-chip" data-field={r.field.toLowerCase()}>{r.field}</span>
              </div>
              <div className="cl-diff-wrap diff-wrap">
                {r.fromVal && <span className="diff-simple-from">{r.fromVal.slice(0, 80)}</span>}
                {r.fromVal && <span className="diff-arrow">→</span>}
                <span className="diff-simple-to">{r.toVal || '(vacío)'}</span>
              </div>
              <div className="cl-meta-wrap">
                <span className="cl-author">{r.author}</span>
                <span className="cl-date">{formatDate(r.date)}</span>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
