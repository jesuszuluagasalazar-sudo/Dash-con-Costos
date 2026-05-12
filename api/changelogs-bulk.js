import { jiraGet, sendJson } from './_jira.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const keys = (req.query.keys || '')
    .split(',').map(k => k.trim()).filter(Boolean).slice(0, 50);

  if (!keys.length) { sendJson(res, 400, { error: 'No keys provided' }); return; }

  const fetchOne = async (key) => {
    try {
      const { body } = await jiraGet(`/rest/api/3/issue/${encodeURIComponent(key)}/changelog?maxResults=100`);
      return { key, data: body };
    } catch {
      return { key, data: { values: [] } };
    }
  };

  const results = {};
  for (let i = 0; i < keys.length; i += 10) {
    const batch = await Promise.all(keys.slice(i, i + 10).map(fetchOne));
    batch.forEach(({ key, data }) => { results[key] = data; });
  }

  sendJson(res, 200, results);
}
