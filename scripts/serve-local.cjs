// Serves a production build on loopback and proxies read-only task requests.
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 8001);
const upstream = new URL(process.env.TASK_API_UPSTREAM || 'http://127.0.0.1:8010');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2' };
if (!fs.existsSync(path.join(root, 'local-runs.html'))) throw new Error('Run npm run build first.');
http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end('Read-only local server'); return; }
  if (request.url.startsWith('/task-api/')) {
    const target = new URL(upstream);
    target.pathname = request.url.slice('/task-api'.length).split('?')[0];
    target.search = new URL(request.url, 'http://localhost').search;
    const proxy = (target.protocol === 'https:' ? https : http).request(target, { method: request.method, headers: { Accept: 'application/json', ...(request.headers.authorization ? { Authorization: request.headers.authorization } : {}) }, timeout: 12000 }, (result) => {
      response.writeHead(result.statusCode, { 'Content-Type': result.headers['content-type'] || 'application/json', 'Cache-Control': 'no-store' }); result.pipe(response);
    });
    proxy.on('timeout', () => proxy.destroy(new Error('timeout')));
    proxy.on('error', () => { if (!response.headersSent) response.writeHead(502, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: 'Task API unavailable' })); }); proxy.end(); return;
  }
  let requested;
  try { requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { response.writeHead(400); response.end(); return; }
  const file = path.resolve(root, '.' + requested + (requested.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
    if (request.method === 'HEAD') response.end(); else fs.createReadStream(file).pipe(response);
  });
}).listen(port, '127.0.0.1', () => console.log(`Admin read-only monitor: http://127.0.0.1:${port}/local-runs.html`));
