// Utilidades compartidas de Jira

const API = '';

export const STATUS_DONE        = ['Finalizado', 'For Release', 'QA Mercantil'];
export const STATUS_QA          = ['QA Pragma'];
export const STATUS_IN_PROGRESS = ['En curso', 'Inspección Par'];
export const STATUS_REFINEMENT  = ['Refinamiento Estratégico', 'Aterrizaje Técnico', 'Aperturado'];
export const STATUS_BLOCKED     = ['Bloqueado'];
// Estos estados NO se cuentan en ninguna categoría
export const STATUS_EXCLUDED    = ['Desestimado', 'Reclasificado'];

export const COLORS = {
  done:       '#22c55e',
  qa:         '#3b82f6',
  inProgress: '#f59e0b',
  refinement: '#a855f7',
  blocked:    '#ef4444',
  pending:    '#94a3b8',
  purple1:    '#2D0066',
  purple2:    '#4A0099',
  purple3:    '#7B3FE4',
  purple4:    '#E0B0FF',
};

export function categorize(counts) {
  let done = 0, qa = 0, inProgress = 0, refinement = 0, blocked = 0, pending = 0;
  Object.entries(counts).forEach(([status, count]) => {
    if (STATUS_EXCLUDED.includes(status))         return; // ignorar completamente
    if (STATUS_DONE.includes(status))             done       += count;
    else if (STATUS_QA.includes(status))          qa         += count;
    else if (STATUS_IN_PROGRESS.includes(status)) inProgress += count;
    else if (STATUS_REFINEMENT.includes(status))  refinement += count;
    else if (STATUS_BLOCKED.includes(status))     blocked    += count;
    else                                          pending    += count;
  });
  return { done, qa, inProgress, refinement, blocked, pending };
}

export function countByStatus(issues) {
  const counts = {};
  issues.forEach(i => {
    const s = i.fields?.status?.name || 'Desconocido';
    if (STATUS_EXCLUDED.includes(s)) return; // no contar desestimados/reclasificados
    counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-PA', {
      day: '2-digit', month: 'short', year: '2-digit',
    });
  } catch { return iso.slice(0, 10); }
}

export function pctNum(num, total) {
  if (!total) return 0;
  return Math.round((num / total) * 100);
}

export function escHtml(str) {
  return String(str ?? '—')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Fetch paginado de issues via API ──────────────────────────────────────
// Versión del caché — incrementar cuando cambie la lógica de filtrado
const CACHE_VERSION = 'v4';

export async function fetchJiraAll(jql) {
  let all = [];
  let pageToken = '';
  const fields = 'summary,status,assignee,priority,issuetype,fixVersions,labels,components,reporter,created,updated,customfield_10020,issuelinks';
  const cacheKey = CACHE_VERSION + '_jira_' + btoa(unescape(encodeURIComponent(jql))).slice(0, 40);

  try {
    while (true) {
      const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const url = `${API}/api/jira?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=100${tokenParam}`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.detail || data.error);
      const issues = data.issues || [];
      all = all.concat(issues);
      if (data.isLast === true || issues.length === 0 || !data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }
    sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: all }));
    return all;
  } catch (err) {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached).data;
    throw err;
  }
}

export const JQL = {
  hfMvp:    'project = NT AND issuetype = "Historia Funcional" AND fixVersion = "MVP_Banca_Personas" AND status != Desestimado AND status != Reclasificado',
  hfR1:     'project = NT AND issuetype = "Historia Funcional" AND fixVersion = "Release 1_Banca_Personas" AND status != Desestimado AND status != Reclasificado',
  habFront: 'project = NT AND issuetype = "Habilitador Front" AND fixVersion = "MVP_Banca_Personas" AND status != Desestimado AND status != Reclasificado',
  habBack:  'project = NT AND issuetype = "Habilitador Back" AND fixVersion = "MVP_Banca_Personas" AND status != Desestimado AND status != Reclasificado',
  ht:       'project = NT AND issuetype = "HT Backend" AND fixVersion = "MVP_Banca_Personas" AND status != Desestimado AND status != Reclasificado',
  def:      'project = NT AND issuetype = "Defecto" AND fixVersion = "MVP_Banca_Personas" AND status != Desestimado AND status != Reclasificado',
};
