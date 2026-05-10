import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_PORT = 4173;
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_DIST_DIR = resolve('dist');

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

function isWithinDirectory(parentDir, candidatePath) {
  const relativePath = relative(parentDir, candidatePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.startsWith(sep));
}

export function safeResolve(urlPath, distDir = DEFAULT_DIST_DIR) {
  try {
    const pathname = new URL(urlPath, 'http://localhost').pathname;
    const decodedPath = decodeURIComponent(pathname);
    const normalizedPath = normalize(decodedPath).replace(/^([/\\.])+/, '');
    const candidate = resolve(distDir, normalizedPath || 'index.html');
    return isWithinDirectory(distDir, candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function sendText(response, statusCode, body, contentType = 'text/plain; charset=utf-8', method = 'GET') {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  response.end(method === 'HEAD' ? undefined : body);
}

function isStaticAssetRequest(pathname) {
  return extname(pathname) !== '' || pathname.startsWith('/images/');
}

export function createAppServer({ distDir = DEFAULT_DIST_DIR } = {}) {
  const resolvedDistDir = resolve(distDir);
  const fallbackFile = join(resolvedDistDir, 'index.html');

  return createServer((request, response) => {
    const method = request.method ?? 'GET';
    const url = request.url ?? '/';
    const pathname = new URL(url, 'http://localhost').pathname;

    if (pathname === '/healthz') {
      sendText(response, 200, 'ok', 'text/plain; charset=utf-8', method);
      return;
    }

    if (method !== 'GET' && method !== 'HEAD') {
      sendText(response, 405, 'Method Not Allowed', 'text/plain; charset=utf-8', method);
      return;
    }

    if (!existsSync(fallbackFile)) {
      sendText(response, 503, 'Build output not found. Run `npm run build` before starting the server.', 'text/plain; charset=utf-8', method);
      return;
    }

    const requestedFile = safeResolve(url, resolvedDistDir);
    const requestedFileExists = Boolean(
      requestedFile && existsSync(requestedFile) && statSync(requestedFile).isFile()
    );

    if (!requestedFileExists && isStaticAssetRequest(pathname)) {
      sendText(response, 404, 'Not Found', 'text/plain; charset=utf-8', method);
      return;
    }

    const filePath = requestedFileExists ? requestedFile : fallbackFile;
    const extension = extname(filePath);
    const isAsset = filePath !== fallbackFile;
    const fileSize = statSync(filePath).size;

    response.writeHead(200, {
      'Content-Type': contentTypes.get(extension) ?? 'application/octet-stream',
      'Content-Length': fileSize,
      'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });

    if (method === 'HEAD') {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  });
}

export function startServer({
  port = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10),
  host = process.env.HOST ?? DEFAULT_HOST,
  distDir = DEFAULT_DIST_DIR,
} = {}) {
  const server = createAppServer({ distDir });
  server.listen(port, host, () => {
    console.log(`AKP site serving ${resolve(distDir)} on http://${host}:${port}`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
