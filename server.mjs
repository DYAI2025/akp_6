import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number.parseInt(process.env.PORT ?? '4173', 10);
const host = process.env.HOST ?? '0.0.0.0';
const distDir = resolve('dist');

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
]);

function safeResolve(urlPath) {
  try {
    const decodedPath = decodeURIComponent(urlPath.split('?')[0] ?? '/');
    const normalizedPath = normalize(decodedPath).replace(/^([/\\.])+/, '');
    const candidate = resolve(distDir, normalizedPath || 'index.html');
    return candidate.startsWith(distDir) ? candidate : null;
  } catch {
    return null;
  }
}

function sendText(response, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  response.end(body);
}

const server = createServer((request, response) => {
  if (request.url === '/healthz') {
    sendText(response, 200, 'ok');
    return;
  }

  const requestedFile = safeResolve(request.url ?? '/');
  const fallbackFile = join(distDir, 'index.html');
  const filePath = requestedFile && existsSync(requestedFile) && statSync(requestedFile).isFile()
    ? requestedFile
    : fallbackFile;

  if (!existsSync(filePath)) {
    sendText(response, 503, 'Build output not found. Run `npm run build` before starting the server.');
    return;
  }

  const extension = extname(filePath);
  const isAsset = filePath !== fallbackFile;
  response.writeHead(200, {
    'Content-Type': contentTypes.get(extension) ?? 'application/octet-stream',
    'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`AKP site serving ${distDir} on http://${host}:${port}`);
});
