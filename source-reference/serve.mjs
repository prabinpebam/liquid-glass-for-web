// Zero-dependency static server for the offline mirror.
// Serves ./site/kube.io as the web root so root-absolute /assets/... paths work.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'site', 'kube.io');
const PORT = process.env.PORT || 8099;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (p.endsWith('/')) p += 'index.html';
  let abs = path.join(ROOT, p);
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    abs = path.join(abs, 'index.html');
  }
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  // try appending index.html for extensionless routes
  if (!path.extname(abs)) {
    const idx = path.join(abs, 'index.html');
    if (fs.existsSync(idx)) return idx;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url === '/' ? '/blog/liquid-glass-css-svg/' : req.url);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + req.url);
    return;
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Offline mirror serving at http://localhost:${PORT}/`);
  console.log(`Article: http://localhost:${PORT}/blog/liquid-glass-css-svg/`);
});
