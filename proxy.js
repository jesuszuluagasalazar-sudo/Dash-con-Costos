/**
 * proxy.js — Servidor proxy local para desarrollo con Vite
 * Expone los mismos endpoints que las funciones serverless de /api/
 *
 * Uso: node proxy.js
 * Luego: npm run dev  (Vite redirige /api/* → localhost:3000)
 */

import 'dotenv/config';
import http  from 'http';
import https from 'https';
import { parse } from 'url';
import teamMembersHandler from './api/team-members.js';
import ajustesMargenHandler from './api/ajustes-margen.js';

const JIRA_HOST  = process.env.JIRA_HOST || 'mercantilpanama.atlassian.net';
const JIRA_EMAIL = process.env.JIRA_EMAIL || 'durrego_pragma@mercantilbanco.com.pa';
const JIRA_TOKEN = process.env.JIRA_TOKEN || '';
const AUTH   = 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
const PORT   = 3000;

console.log('\n🔍 Configuración cargada:');
console.log(`   JIRA_HOST: ${JIRA_HOST}`);
console.log(`   JIRA_EMAIL: ${JIRA_EMAIL}`);
console.log(`   JIRA_TOKEN: ${JIRA_TOKEN ? '***' + JIRA_TOKEN.slice(-10) : 'NO CONFIGURADO'}`);
console.log();

function jiraGet(jiraPath) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: JIRA_HOST, path: jiraPath, method: 'GET',
        headers: { 'Authorization': AUTH, 'Accept': 'application/json' } },
      (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = parse(req.url, true);
  const q      = parsed.query;

  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const send = (status, data) => {
    res.writeHead(status);
    res.end(typeof data === 'string' ? data : JSON.stringify(data));
  };

  try {
    // Quitar el prefijo /api si viene de Vite proxy
    const path = parsed.pathname.replace(/^\/api/, '');

    if (path === '/jira') {
      const { jql = '', maxResults = '100', fields = 'status', pageToken = '' } = q;
      // La nueva API /rest/api/3/search/jql usa nextPageToken, no startAt
      const jiraPath = pageToken
        ? `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=${maxResults}&nextPageToken=${encodeURIComponent(pageToken)}`
        : `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=${maxResults}`;
      const r = await jiraGet(jiraPath);
      send(r.status, r.body);

    } else if (path === '/issue') {
      const { key = '', expand = 'changelog', fields = 'summary,status,assignee,issuetype,fixVersions,priority,labels,description,reporter,created,updated,components' } = q;
      const r = await jiraGet(`/rest/api/3/issue/${encodeURIComponent(key)}?expand=${expand}&fields=${fields}`);
      send(r.status, r.body);

    } else if (path === '/changelog') {
      const { key = '', startAt = '0', maxResults = '100' } = q;
      const r = await jiraGet(`/rest/api/3/issue/${encodeURIComponent(key)}/changelog?startAt=${startAt}&maxResults=${maxResults}`);
      send(r.status, r.body);

    } else if (path === '/user') {
      const r = await jiraGet(`/rest/api/3/user?accountId=${encodeURIComponent(q.accountId || '')}&expand=groups`);
      send(r.status, r.body);

    } else if (path === '/user-issues') {
      const jql = `project = NT AND assignee = "${q.accountId}" ORDER BY updated DESC`;
      const r = await jiraGet(`/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary,status,issuetype,fixVersions,priority,created,updated,customfield_10020&maxResults=${q.maxResults || 50}`);
      send(r.status, r.body);

    } else if (path === '/user-activity') {
      const jql = `project = NT AND (assignee = "${q.accountId}" OR reporter = "${q.accountId}") ORDER BY updated DESC`;
      const r = await jiraGet(`/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary,status,updated,assignee,reporter&maxResults=1`);
      send(r.status, r.body);

    } else if (path === '/versions') {
      const project = q.project || 'NT';
      const r = await jiraGet(`/rest/api/3/project/${encodeURIComponent(project)}/versions`);
      send(r.status, r.body);

    } else if (path === '/boards') {
      const r = await jiraGet(`/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(q.project || 'NT')}&maxResults=50`);
      send(r.status, r.body);

    } else if (path === '/board-sprints') {
      const state = encodeURIComponent(q.state || 'active,future,closed');
      const r = await jiraGet(`/rest/agile/1.0/board/${encodeURIComponent(q.boardId || '')}/sprint?state=${state}&maxResults=50`);
      send(r.status, r.body);

    } else if (path === '/board-issues') {
      const fields = 'summary,status,assignee,priority,issuetype,fixVersions,labels,components,reporter,created,updated,customfield_10020';
      const jiraPath = q.sprintId
        ? `/rest/agile/1.0/sprint/${encodeURIComponent(q.sprintId)}/issue?fields=${fields}&maxResults=${q.maxResults || 100}&startAt=${q.startAt || 0}`
        : `/rest/agile/1.0/board/${encodeURIComponent(q.boardId || '')}/issue?fields=${fields}&maxResults=${q.maxResults || 100}&startAt=${q.startAt || 0}`;
      const r = await jiraGet(jiraPath);
      send(r.status, r.body);

    } else if (path === '/team-members') {
      req.url = req.url.replace(/^\/api/, '');
      return teamMembersHandler(req, res);

    } else if (path === '/ajustes-margen') {
      req.url = req.url.replace(/^\/api/, '');
      return ajustesMargenHandler(req, res);

    } else if (path === '/changelogs-bulk') {
      const keys = (q.keys || '').split(',').map(k => k.trim()).filter(Boolean).slice(0, 50);
      const results = {};
      for (let i = 0; i < keys.length; i += 10) {
        const batch = await Promise.all(
          keys.slice(i, i + 10).map(async key => {
            try {
              const r = await jiraGet(`/rest/api/3/issue/${encodeURIComponent(key)}/changelog?maxResults=100`);
              return { key, data: JSON.parse(r.body) };
            } catch { return { key, data: { values: [] } }; }
          })
        );
        batch.forEach(({ key, data }) => { results[key] = data; });
      }
      send(200, results);

    } else {
      send(404, { error: 'Ruta no encontrada' });
    }
  } catch (err) {
    send(502, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  ✅  Proxy corriendo en http://localhost:${PORT}`);
  console.log(`  🔌  Conectado a: ${JIRA_HOST}`);
  console.log(`\n  Ahora ejecuta: npm run dev\n`);
});
