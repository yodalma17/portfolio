// Minimal static file server for local preview.
// Usage: node serve.js  -> http://localhost:5500
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 5500;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.wasm': 'application/wasm', '.unityweb': 'application/octet-stream',
  '.glb': 'model/gltf-binary', '.pdf': 'application/pdf',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  // game folders without the trailing slash: redirect so their relative paths resolve
  if (!path.extname(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
    res.writeHead(301, { Location: urlPath + '/' }); return res.end();
  }
  // heavy game files (Unity builds, 3D models) can be cached; pages stay fresh
  const cacheable = /^\/games\/.+\.(unityweb|wasm|glb|js|png|ico)$/.test(urlPath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const type = TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, cacheable
      ? { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' }
      : {
        'Content-Type': type,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
    res.end(data);
  });
}).listen(PORT, () => console.log('Serving on http://localhost:' + PORT));
