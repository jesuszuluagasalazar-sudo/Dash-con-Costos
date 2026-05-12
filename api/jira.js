import { jiraGet, sendJson } from './_jira.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const { jql = '', maxResults = '100', fields = 'status', pageToken = '' } = req.query;

  // La nueva API /rest/api/3/search/jql usa nextPageToken, no startAt
  const path = pageToken
    ? `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=${maxResults}&nextPageToken=${encodeURIComponent(pageToken)}`
    : `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=${maxResults}`;

  try {
    const { status, body } = await jiraGet(path);
    sendJson(res, status, body);
  } catch (err) {
    sendJson(res, 502, { error: 'Error de conexión con Jira', detail: err.message });
  }
}
