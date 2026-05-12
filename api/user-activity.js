import { jiraGet, sendJson } from './_jira.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const { accountId = '' } = req.query;
  const jql  = `project = NT AND (assignee = "${accountId}" OR reporter = "${accountId}") ORDER BY updated DESC`;
  const path = `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary,status,updated,assignee,reporter&maxResults=1`;
  try {
    const { status, body } = await jiraGet(path);
    sendJson(res, status, body);
  } catch (err) {
    sendJson(res, 502, { error: err.message });
  }
}
