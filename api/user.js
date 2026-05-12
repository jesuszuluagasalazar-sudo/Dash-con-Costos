import { jiraGet, sendJson } from './_jira.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const { accountId = '' } = req.query;
  const path = `/rest/api/3/user?accountId=${encodeURIComponent(accountId)}&expand=groups`;
  try {
    const { status, body } = await jiraGet(path);
    sendJson(res, status, body);
  } catch (err) {
    sendJson(res, 502, { error: err.message });
  }
}
