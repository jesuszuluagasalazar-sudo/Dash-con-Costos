import { useState, useCallback } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { StatusBadge } from '../ui/Badge';
import { formatDate } from '../../utils/jira';

const API = '';
const BATCH = 20;

export function TabModificadas({ onClickIssue, onClickUser }) {
  const store = useDashboardStore();

  const [state, setState] = useState({
    status: 'idle',   // idle | loading | done | error
    progress: '',
    allRows: [],      // { issue, changes[], lastMod }
    error: null,
  });

  // Filtros
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [authorId,   setAuthorId]   = useState('');
  const [fieldFilter,setFieldFilter]= useState('');
  const [search,     setSearch]     = useState('');

  // ── Cargar changelogs ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setState(s => ({ ...s, status: 'loading', progress: 'Recopilando issues...', allRows: [] }));

    try {
      // Recopilar todos los issues únicos
      const raw = store.rawIssues;
      const seen = new Set();
      const allIssues = [];
      [raw.issHfMvp, raw.issHfR1, raw.issHabFront, raw.issHabBack, raw.issHt, raw.issDef]
        .forEach(arr => (arr || []).forEach(i => {
          if (!seen.has(i.key)) { seen.add(i.key); allIssues.push(i); }
        }));

      if (!allIssues.length) {
        setState(s => ({ ...s, status: 'error', error: 'No hay issues cargados. Espera a que el dashboard termine de cargar.' }));
        return;
      }

      const keys = allIssues.map(i => i.key);
      const changelogs = {};

      for (let i = 0; i < keys.length; i += BATCH) {
        const batch = keys.slice(i, i + BATCH);
        setState(s => ({ ...s, progress: `Consultando changelogs... ${i}/${keys.length}` }));
        const res = await fetch(`${API}/api/changelogs-bulk?keys=${encodeURIComponent(batch.join(','))}`);
        if (res.ok) Object.assign(changelogs, await res.json());
      }

      // Construir filas: solo issues con cambios POST-creación (margen 60s)
      const rows = [];
      allIssues.forEach(issue => {
        const cl      = changelogs[issue.key];
        const created = issue.fields?.created ? new Date(issue.fields.created) : null;
        if (!cl?.values?.length || !created) return;

        const changes = [];
        cl.values.forEach(entry => {
          const entryDate = entry.created ? new Date(entry.created) : null;
          if (!entryDate || entryDate - created < 60000) return;
          (entry.items || []).forEach(item => {
            if (!item.field) return;
            changes.push({
              field:           item.field,
              from:            item.fromString || item.from || '',
              to:              item.toString   || item.to   || '',
              author:          entry.author?.displayName || entry.author?.emailAddress || 'Sistema',
              authorAccountId: entry.author?.accountId   || '',
              authorAvatar:    entry.author?.avatarUrls?.['24x24'] || '',
              date:            entry.created || '',
              dateObj:         entryDate,
            });
          });
        });

        if (!changes.length) return;
        const lastMod = changes.reduce((max, c) => c.dateObj > max ? c.dateObj : max, new Date(0));
        rows.push({ issue, changes, lastMod });
      });

      rows.sort((a, b) => b.lastMod - a.lastMod);
      setState({ status: 'done', progress: '', allRows: rows, error: null });

    } catch (err) {
      setState(s => ({ ...s, status: 'error', error: err.message }));
    }
  }, [store.rawIssues]);

  // ── Filtrado ─────────────────────────────────────────────────────────────
  const fromDate = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
  const toDate   = dateTo   ? new Date(dateTo   + 'T23:59:59') : null;
  const q        = search.toLowerCase().trim();

  const filtered = state.allRows.filter(r => {
    if (q) {
      const inKey    = r.issue.key.toLowerCase().includes(q);
      const inSum    = (r.issue.fields?.summary || '').toLowerCase().includes(q);
      const inAuthor = r.changes.some(c => c.author.toLowerCase().includes(q));
      if (!inKey && !inSum && !inAuthor) return false;
    }
    const rel = r.changes.filter(c => {
      if (authorId    && c.authorAccountId !== authorId) return false;
      if (fieldFilter && c.field !== fieldFilter)         return false;
      if (fromDate    && c.dateObj < fromDate)            return false;
      if (toDate      && c.dateObj > toDate)              return false;
      return true;
    });
    return rel.length > 0;
  });

  // Opciones únicas para selects
  const authors = new Map();
  const fields  = new Set();
  state.allRows.forEach(r => r.changes.forEach(c => {
    if (c.authorAccountId) authors.set(c.authorAccountId, c.author);
    fields.add(c.field);
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="section-title">✏️ Historias Modificadas después de su creación</div>

      {/* Botón cargar */}
      {state.status === 'idle' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: '#888', marginBottom: 16 }}>
            Consulta el historial de cambios de todos los issues para detectar cuáles fueron modificados después de crearse.
          </p>
          <button
            className="modal-jira-link"
            style={{ display: 'inline-flex', cursor: 'pointer', border: 'none' }}
            onClick={load}
          >
            🔍 Analizar historial de cambios
          </button>
        </div>
      )}

      {/* Loading */}
      {state.status === 'loading' && (
        <div className="mod-loading">
          <div className="mod-spinner" />
          <span>{state.progress}</span>
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div className="error-box" style={{ margin: '20px 0' }}>⚠️ {state.error}</div>
      )}

      {/* Resultados */}
      {state.status === 'done' && (
        <>
          {/* Barra de filtros */}
          <div className="mod-filter-bar">
            {/* Búsqueda */}
            <input
              className="detail-search"
              type="text"
              placeholder="Buscar por clave, título, autor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 200 }}
            />

            {/* Fecha desde/hasta */}
            <div className="mod-filter-group">
              <span className="mod-filter-label">📅 Modificado</span>
              <input type="date" className="adv-filter-date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span style={{ color: '#ccc' }}>—</span>
              <input type="date" className="adv-filter-date" value={dateTo}   onChange={e => setDateTo(e.target.value)} />
            </div>

            {/* Autor */}
            <div className="mod-filter-group">
              <span className="mod-filter-label">👤 Autor</span>
              <select className="adv-filter-select" value={authorId} onChange={e => setAuthorId(e.target.value)} style={{ minWidth: 180 }}>
                <option value="">Todos</option>
                {[...authors.entries()].sort((a,b) => a[1].localeCompare(b[1])).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            {/* Campo */}
            <div className="mod-filter-group">
              <span className="mod-filter-label">🔖 Campo</span>
              <select className="adv-filter-select" value={fieldFilter} onChange={e => setFieldFilter(e.target.value)} style={{ minWidth: 140 }}>
                <option value="">Todos</option>
                {[...fields].sort().map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Limpiar */}
            <button className="adv-filter-clear" onClick={() => {
              setDateFrom(''); setDateTo(''); setAuthorId(''); setFieldFilter(''); setSearch('');
            }}>✕ Limpiar</button>

            {/* Contador */}
            <span className="changelog-count" style={{ marginLeft: 'auto' }}>
              {filtered.length} de {state.allRows.length} historia{state.allRows.length !== 1 ? 's' : ''}
            </span>

            {/* Recargar */}
            <button className="adv-filter-clear" onClick={load} title="Recargar">↺ Recargar</button>
          </div>

          {/* Tabla */}
          {filtered.length === 0 ? (
            <div className="mod-empty"><p>Sin resultados para los filtros aplicados</p></div>
          ) : (
            <div className="detail-table-card" style={{ marginTop: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="mod-table">
                  <thead>
                    <tr>
                      <th>Clave</th>
                      <th>Título</th>
                      <th>Estado</th>
                      <th>Asignado</th>
                      <th>Creado</th>
                      <th>Última mod.</th>
                      <th>Cambios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <IssueRow
                        key={r.issue.key}
                        row={r}
                        authorId={authorId}
                        fieldFilter={fieldFilter}
                        fromDate={fromDate}
                        toDate={toDate}
                        onClickIssue={onClickIssue}
                        onClickUser={onClickUser}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Fila individual ──────────────────────────────────────────────────────────
function IssueRow({ row, authorId, fieldFilter, fromDate, toDate, onClickIssue, onClickUser }) {
  const { issue, changes, lastMod } = row;
  const f = issue.fields || {};

  // Filtrar cambios visibles según filtros activos
  const visible = changes.filter(c => {
    if (authorId    && c.authorAccountId !== authorId) return false;
    if (fieldFilter && c.field !== fieldFilter)         return false;
    if (fromDate    && c.dateObj < fromDate)            return false;
    if (toDate      && c.dateObj > toDate)              return false;
    return true;
  });

  // Agrupar por sesión (mismo autor + misma fecha/hora redondeada al minuto)
  const grouped = new Map();
  visible.forEach(c => {
    const gKey = `${c.authorAccountId}__${c.date.slice(0, 16)}`;
    if (!grouped.has(gKey)) {
      grouped.set(gKey, { author: c.author, accountId: c.authorAccountId, avatar: c.authorAvatar, date: c.date, items: [] });
    }
    grouped.get(gKey).items.push(c);
  });

  return (
    <tr>
      <td className="issue-key">
        <a href="#" onClick={e => { e.preventDefault(); onClickIssue?.(issue.key); }}>{issue.key}</a>
      </td>
      <td className="issue-summary" style={{ maxWidth: 220 }}>
        <span title={f.summary}>{f.summary || '—'}</span>
      </td>
      <td><StatusBadge status={f.status?.name} /></td>
      <td>
        {f.assignee ? (
          <span
            className="assignee-cell assignee-link"
            onClick={() => f.assignee?.accountId && onClickUser?.(f.assignee.accountId, f.assignee.displayName, f.assignee.avatarUrls?.['24x24'])}
          >
            {f.assignee.avatarUrls?.['24x24'] && (
              <img className="assignee-avatar" src={f.assignee.avatarUrls['24x24']} alt="" onError={e => { e.target.style.display='none'; }} />
            )}
            {f.assignee.displayName || f.assignee.emailAddress}
          </span>
        ) : <span style={{ color: '#bbb', fontSize: '0.78rem' }}>Sin asignar</span>}
      </td>
      <td className="date-cell">{formatDate(f.created)}</td>
      <td className="date-cell">{formatDate(lastMod.toISOString())}</td>
      <td style={{ minWidth: 260 }}>
        {[...grouped.values()].map((g, idx) => (
          <div key={idx} style={{ marginBottom: idx < grouped.size - 1 ? 10 : 0 }}>
            {/* Autor + fecha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span className="mod-author-badge">
                {g.avatar && <img src={g.avatar} style={{ width: 14, height: 14, borderRadius: '50%', verticalAlign: 'middle' }} onError={e => { e.target.style.display='none'; }} alt="" />}
                {g.author}
              </span>
              <span className="mod-date-badge">🕐 {formatDate(g.date)}</span>
            </div>
            {/* Cambios */}
            <div className="mod-changes-list">
              {g.items.map((c, i) => (
                <div key={i} className="mod-change-item">
                  <span className="mod-change-field" data-f={c.field.toLowerCase()}>{c.field}</span>
                  <span className="mod-change-val">
                    {c.from && <span className="mod-change-from">{c.from.slice(0, 60)}{c.from.length > 60 ? '…' : ''}</span>}
                    <span className="mod-change-to">{c.to ? c.to.slice(0, 80) + (c.to.length > 80 ? '…' : '') : '(vacío)'}</span>
                  </span>
                </div>
              ))}
            </div>
            {idx < grouped.size - 1 && <hr style={{ border: 'none', borderTop: '1px solid #f0ebff', margin: '8px 0' }} />}
          </div>
        ))}
      </td>
    </tr>
  );
}
