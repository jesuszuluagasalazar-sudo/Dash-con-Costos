import { useState, useMemo } from 'react';
import { StatusBadge, PriorityIcon } from './Badge';
import { AssigneeCell } from './AssigneeCell';
import { formatDate } from '../../utils/jira';

const PAGE_SIZE = 25;

export function IssueTable({ issues = [], onClickIssue, onClickUser, showLinkedIssues = false }) {
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = q
      ? issues.filter(i =>
          (i.key || '').toLowerCase().includes(q) ||
          (i.fields?.summary || '').toLowerCase().includes(q) ||
          (i.fields?.assignee?.displayName || '').toLowerCase().includes(q) ||
          (i.fields?.status?.name || '').toLowerCase().includes(q)
        )
      : issues;

    if (sortCol) {
      list = [...list].sort((a, b) => {
        let va = '', vb = '';
        if (sortCol === 'key')      { va = a.key; vb = b.key; }
        if (sortCol === 'summary')  { va = a.fields?.summary; vb = b.fields?.summary; }
        if (sortCol === 'status')   { va = a.fields?.status?.name; vb = b.fields?.status?.name; }
        if (sortCol === 'assignee') { va = a.fields?.assignee?.displayName; vb = b.fields?.assignee?.displayName; }
        if (sortCol === 'updated')  { va = a.fields?.updated; vb = b.fields?.updated; }
        if (sortCol === 'created')  { va = a.fields?.created; vb = b.fields?.created; }
        return (va || '').localeCompare(vb || '') * sortDir;
      });
    }
    return list;
  }, [issues, search, sortCol, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d * -1);
    else { setSortCol(col); setSortDir(1); }
    setPage(1);
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="sort-icon">⇅</span>;
    return <span className="sort-icon">{sortDir === 1 ? '↑' : '↓'}</span>;
  };

  const cols = [
    { key: 'key',      label: 'Clave' },
    { key: 'summary',  label: 'Título' },
    { key: 'status',   label: 'Estado' },
    { key: 'priority', label: 'Prioridad' },
    { key: 'assignee', label: 'Asignado a' },
    { key: 'created',  label: 'Creado' },
    { key: 'updated',  label: 'Actualizado' },
  ];

  if (showLinkedIssues) {
    cols.push({ key: 'linked', label: 'CD Arquitectura' });
  }

  // Componente para mostrar issues enlazados
  const LinkedIssuesCell = ({ issuelinks }) => {
    if (!issuelinks || issuelinks.length === 0) return <span style={{ color: '#aaa' }}>—</span>;
    
    const linked = issuelinks
      .map(link => {
        // Puede ser inwardIssue o outwardIssue
        const issue = link.inwardIssue || link.outwardIssue;
        if (!issue) return null;
        
        // Filtrar solo issues de tipo "Diseño de Arquitectura CD"
        const issueType = issue.fields?.issuetype?.name || '';
        if (issueType !== 'Diseño de Arquitectura CD') return null;
        
        return {
          key: issue.key,
          status: issue.fields?.status?.name || '—',
          type: link.type?.name || '—'
        };
      })
      .filter(Boolean);

    if (linked.length === 0) return <span style={{ color: '#aaa' }}>—</span>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {linked.map((l, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <a 
              href="#" 
              onClick={e => { e.preventDefault(); onClickIssue?.(l.key); }}
              style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                color: '#7C3AED',
                textDecoration: 'none'
              }}
            >
              {l.key}
            </a>
            <StatusBadge status={l.status} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="detail-table-toolbar">
        <input
          className="detail-search"
          type="text"
          placeholder="Buscar por clave, título, asignado..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <span className="detail-count">{filtered.length} issue{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <table className="detail-table">
        <thead>
          <tr>
            {cols.map(c => (
              <th
                key={c.key}
                className={sortCol === c.key ? 'sorted' : ''}
                onClick={() => handleSort(c.key)}
              >
                {c.label}<SortIcon col={c.key} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slice.length === 0 ? (
            <tr><td colSpan={showLinkedIssues ? 8 : 7} style={{ textAlign: 'center', color: '#aaa', padding: '30px' }}>Sin resultados</td></tr>
          ) : slice.map(i => (
            <tr key={i.key}>
              <td className="issue-key">
                <a href="#" onClick={e => { e.preventDefault(); onClickIssue?.(i.key); }}>
                  {i.key}
                </a>
              </td>
              <td className="issue-summary">
                <span title={i.fields?.summary}>{i.fields?.summary || '—'}</span>
              </td>
              <td><StatusBadge status={i.fields?.status?.name} /></td>
              <td>
                <PriorityIcon priority={i.fields?.priority} />
                {i.fields?.priority?.name || '—'}
              </td>
              <td>
                <AssigneeCell assignee={i.fields?.assignee} onClickUser={onClickUser} />
              </td>
              <td className="date-cell">{formatDate(i.fields?.created)}</td>
              <td className="date-cell">{formatDate(i.fields?.updated)}</td>
              {showLinkedIssues && (
                <td><LinkedIssuesCell issuelinks={i.fields?.issuelinks} /></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {pages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Ant</button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Sig ›</button>
          <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Página {page} de {pages} · {filtered.length} issues</span>
        </div>
      )}
    </div>
  );
}
