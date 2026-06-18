// Minimal static server for the Design Library docs example.
//   node examples/design-library/serve.mjs   ->   http://localhost:8200/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8200;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (rel === '/' || rel.endsWith('/')) rel += 'index.html';
    const path = normalize(join(__dirname, rel));
    if (!path.startsWith(__dirname)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Liquid Glass design library at http://localhost:${PORT}/`);
});
