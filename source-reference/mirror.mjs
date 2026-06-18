// Offline mirror builder for https://kube.io/blog/liquid-glass-css-svg/
// Seeds from the exact set of resources the live page loaded (urls.json),
// downloads them, recursively resolves CSS @font-face/url() references, rewrites
// cross-origin asset hosts into a local /_ext/ tree, and neutralizes analytics.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'site', 'kube.io'); // served as web root '/'
const PAGE = 'https://kube.io/blog/liquid-glass-css-svg/';
const PRIMARY_HOST = 'kube.io';
const ASSET_HOSTS = new Set(['rsms.me', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'images.unsplash.com']);
const DROP_HOSTS = new Set(['plausible.io', 'static.cloudflareinsights.com']);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const urlsJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'urls.json'), 'utf8'));
const EXTRA_SEEDS = [
  'https://kube.io/favicons/favicon.ico',
  'https://kube.io/favicons/favicon-16x16.png',
  'https://kube.io/favicons/favicon-32x32.png',
  'https://kube.io/favicons/favicon-48x48.png',
  'https://kube.io/favicons/manifest.webmanifest',
  'https://kube.io/logo.png',
];
const seedUrls = [...urlsJson.urls.filter(Boolean), ...EXTRA_SEEDS];

const mapped = new Map(); // url -> rec
const queue = [];

function planLocal(u) {
  const url = new URL(u);
  if (url.hostname === PRIMARY_HOST) {
    let webPath = url.pathname;
    if (webPath.endsWith('/')) webPath += 'index.html';
    return webPath;
  }
  let p = url.pathname;
  if (p === '' || p.endsWith('/')) p += 'index';
  let webPath = '/_ext/' + url.hostname + p;
  if (url.search) {
    const ext = path.extname(p);
    const base = webPath.slice(0, webPath.length - ext.length);
    const q = url.search.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 50);
    webPath = base + '__' + q + (ext || '.css');
  } else if (!path.extname(p) && (url.hostname === 'fonts.googleapis.com')) {
    webPath += '.css';
  }
  return webPath;
}

function allowed(host) {
  return host === PRIMARY_HOST || ASSET_HOSTS.has(host) || /\.mzstatic\.com$/.test(host);
}

function enqueue(u) {
  let clean;
  try { clean = new URL(u); } catch { return null; }
  if (!/^https?:$/.test(clean.protocol)) return null;
  clean.hash = '';
  if (!allowed(clean.hostname)) return null;
  const key = clean.href;
  if (mapped.has(key)) return mapped.get(key).local;
  const local = planLocal(key);
  const file = path.join(ROOT, local.replace(/^\//, ''));
  const rec = { url: key, local, file, done: false };
  mapped.set(key, rec);
  queue.push(rec);
  return local;
}

async function fetchBuf(u) {
  const res = await fetch(u, { headers: { 'User-Agent': UA, 'Accept': '*/*' }, redirect: 'follow' });
  const ab = await res.arrayBuffer();
  return { buf: Buffer.from(ab), ct: res.headers.get('content-type') || '', status: res.status };
}

function rewriteText(text, baseUrl, kind) {
  // Absolute cross-origin URLs in quotes/url(): only for css & html
  if (kind === 'css' || kind === 'html') {
    text = text.replace(/(url\(\s*['"]?|["'])(https?:\/\/[^"')\s]+)(['"]?\s*\)|["'])/g,
      (m, pre, abs, post) => {
        let host = ''; try { host = new URL(abs).hostname; } catch {}
        if (DROP_HOSTS.has(host)) return pre + 'about:blank' + post;
        const local = enqueue(abs);
        return local ? pre + local + post : m;
      });
  }
  if (kind === 'css') {
    text = text.replace(/url\(\s*(['"]?)([^"')]+)\1\s*\)/g, (m, q, ref) => {
      if (/^(data:|about:|\/)/.test(ref) || /^https?:/.test(ref)) return m;
      let abs; try { abs = new URL(ref, baseUrl).href; } catch { return m; }
      const local = enqueue(abs);
      return local ? `url(${q}${local}${q})` : m;
    });
    text = text.replace(/@import\s+(['"])([^'"]+)\1/g, (m, q, ref) => {
      if (/^https?:/.test(ref) || ref.startsWith('/')) return m;
      let abs; try { abs = new URL(ref, baseUrl).href; } catch { return m; }
      const local = enqueue(abs);
      return local ? `@import ${q}${local}${q}` : m;
    });
  }
  return text;
}

async function run() {
  enqueue(PAGE);
  for (const u of seedUrls) enqueue(u);

  let i = 0;
  while (i < queue.length) {
    const rec = queue[i++];
    if (rec.done) continue;
    try {
      fs.mkdirSync(path.dirname(rec.file), { recursive: true });
      const { buf, ct } = await fetchBuf(rec.url);
      const isCss = /css/i.test(ct) || /\.css$/i.test(rec.local) || rec.url.includes('css2');
      const isHtml = /html/i.test(ct) || /\.html$/i.test(rec.local);
      if (isCss || isHtml) {
        let text = buf.toString('utf8');
        text = rewriteText(text, rec.url, isCss ? 'css' : 'html');
        fs.writeFileSync(rec.file, text, 'utf8');
      } else {
        fs.writeFileSync(rec.file, buf); // js, png, woff2, svg kept verbatim
      }
      rec.done = true;
      process.stdout.write(`. ${path.basename(rec.file)}\n`);
    } catch (e) {
      rec.error = String(e);
      process.stdout.write(`X ${rec.url} -> ${e}\n`);
    }
  }

  const summary = [...mapped.values()].map(r => ({ url: r.url, local: r.local, error: r.error || null }));
  fs.writeFileSync(path.join(__dirname, 'mirror-report.json'), JSON.stringify(summary, null, 2));
  const errs = summary.filter(s => s.error);
  console.log(`\nDownloaded ${summary.length - errs.length}/${summary.length}. Errors: ${errs.length}`);
  for (const e of errs) console.log('  ERR', e.url, e.error);
}

run();
