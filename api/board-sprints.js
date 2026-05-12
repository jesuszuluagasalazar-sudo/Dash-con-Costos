import { jiraGet, sendJson } from './_jira.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const { boardId = '', state = 'active,future,closed' } = req.query;
  const path = `/rest/agile/1.0/board/${encodeURIComponent(boardId)}/sprint?state=${encodeURIComponent(state)}&maxResults=50`;
  try {
    const { status, body } = await jiraGet(path);
    sendJson(res, status, body);
  } catch (err) {
    sendJson(res, 502, { error: err.message });
  }
}
