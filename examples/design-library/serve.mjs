// Minimal static server for the Design Library docs example.
//   node examples/design-library/serve.mjs   ->   http://localhost:8200/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8200;
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse"><stop stop-color="#74c0fc"/><stop offset="1" stop-color="#4d7cff"/></linearGradient></defs><rect x="8" y="8" width="48" height="48" rx="16" fill="url(#g)"/><path d="M22 42V22h7v14h13v6H22Z" fill="white" fill-opacity=".92"/></svg>`;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const NO_STORE = 'no-store, no-cache, must-revalidate, proxy-revalidate';

const server = createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (rel === '/favicon.svg' || rel === '/favicon.ico') {
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': NO_STORE });
      res.end(FAVICON);
      return;
    }
    if (rel === '/' || rel.endsWith('/')) rel += 'index.html';
    const path = normalize(join(__dirname, rel));
    if (!path.startsWith(__dirname)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', 'cache-control': NO_STORE, pragma: 'no-cache', expires: '0' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Liquid Glass design library at http://localhost:${PORT}/`);
});
