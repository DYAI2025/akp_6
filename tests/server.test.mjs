import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { createAppServer, parsePort, safeResolve } from '../server.mjs';

let tempDir;
let server;
let baseUrl;

function request(path, options) {
  return fetch(`${baseUrl}${path}`, options);
}

before(async () => {
  tempDir = join(tmpdir(), `akp-server-tests-${process.pid}`);
  await mkdir(join(tempDir, 'images'), { recursive: true });
  await writeFile(join(tempDir, 'index.html'), '<!doctype html><title>AKP</title><div id="root"></div>');
  await writeFile(join(tempDir, 'app.js'), 'console.log("akp")');
  await writeFile(join(tempDir, 'images', 'cover-building.jpg'), 'fake-jpeg');

  server = createAppServer({ distDir: tempDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('parsePort accepts Railway-compatible ports and falls back from invalid input', () => {
  assert.equal(parsePort('3000'), 3000);
  assert.equal(parsePort('0', 8080), 8080);
  assert.equal(parsePort('70000', 8080), 8080);
  assert.equal(parsePort('not-a-port', 8080), 8080);
});

test('safeResolve keeps requests inside the build directory', () => {
  assert.equal(safeResolve('/app.js', tempDir), join(tempDir, 'app.js'));
  assert.equal(safeResolve('/%2e%2e/package.json', tempDir), join(tempDir, 'package.json'));
  assert.equal(safeResolve('/..%2fpackage.json', tempDir), join(tempDir, 'package.json'));
});

test('serves healthcheck, SPA routes, and immutable assets correctly', async () => {
  const health = await request('/healthz?railway=1');
  assert.equal(health.status, 200);
  assert.equal(await health.text(), 'ok');

  const route = await request('/kontakt');
  assert.equal(route.status, 200);
  assert.equal(route.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(route.headers.get('cache-control'), 'no-cache');
  assert.match(await route.text(), /<div id="root"><\/div>/);

  const asset = await request('/app.js');
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('content-type'), 'text/javascript; charset=utf-8');
  assert.equal(asset.headers.get('cache-control'), 'public, max-age=31536000, immutable');
});

test('does not hide missing static assets behind the SPA fallback', async () => {
  const missingImage = await request('/images/missing.jpg');
  assert.equal(missingImage.status, 404);
  assert.equal(await missingImage.text(), 'Not Found');

  const unsupportedMethod = await request('/kontakt', { method: 'POST' });
  assert.equal(unsupportedMethod.status, 405);

  const unsupportedHealthMethod = await request('/healthz', { method: 'POST' });
  assert.equal(unsupportedHealthMethod.status, 405);
});

test('HEAD requests expose metadata without a response body', async () => {
  const response = await request('/app.js', { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-length'), '18');
  assert.equal(await response.text(), '');
});
