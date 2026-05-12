import https from 'https';

const JIRA_HOST  = 'mercantilpanama.atlassian.net';
const JIRA_EMAIL = process.env.JIRA_EMAIL || 'durrego_pragma@mercantilbanco.com.pa';
const JIRA_TOKEN = process.env.JIRA_TOKEN || '';

const AUTH_HEADER = 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');

export function jiraGet(jiraPath) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: JIRA_HOST,
        path:     jiraPath,
        method:   'GET',
        headers: {
          'Authorization': AUTH_HEADER,
          'Accept':        'application/json',
          'Content-Type':  'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try   { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
          catch { resolve({ status: res.statusCode, body: { raw: body } }); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

export function sendJson(res, status, data) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(status).json(data);
}
