import { jiraGet, sendJson } from './_jira.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const { key = '', expand = 'changelog', fields = 'summary,status,assignee,issuetype,fixVersions,priority,labels,description,reporter,created,updated,components' } = req.query;
  const path = `/rest/api/3/issue/${encodeURIComponent(key)}?expand=${expand}&fields=${fields}`;
  try {
    const { status, body } = await jiraGet(path);
    sendJson(res, status, body);
  } catch (err) {
    sendJson(res, 502, { error: 'Error de conexión con Jira', detail: err.message });
  }
}
