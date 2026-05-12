import { jiraGet, sendJson } from './_jira.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const { accountId = '', maxResults = '50' } = req.query;
  const jql  = `project = NT AND assignee = "${accountId}" ORDER BY updated DESC`;
  const fields = 'summary,status,issuetype,fixVersions,priority,created,updated,customfield_10020';
  const path = `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=${maxResults}`;
  try {
    const { status, body } = await jiraGet(path);
    sendJson(res, status, body);
  } catch (err) {
    sendJson(res, 502, { error: err.message });
  }
}
