import { jiraGet, sendJson } from './_jira.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const { boardId = '', sprintId = '', startAt = '0', maxResults = '100' } = req.query;
  const fields = 'summary,status,assignee,priority,issuetype,fixVersions,labels,components,reporter,created,updated,customfield_10020';
  const path = sprintId
    ? `/rest/agile/1.0/sprint/${encodeURIComponent(sprintId)}/issue?fields=${fields}&maxResults=${maxResults}&startAt=${startAt}`
    : `/rest/agile/1.0/board/${encodeURIComponent(boardId)}/issue?fields=${fields}&maxResults=${maxResults}&startAt=${startAt}`;
  try {
    const { status, body } = await jiraGet(path);
    sendJson(res, status, body);
  } catch (err) {
    sendJson(res, 502, { error: err.message });
  }
}
