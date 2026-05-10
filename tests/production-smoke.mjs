import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const port = 46000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
server.stdout.on('data', (chunk) => {
  output += chunk;
});
server.stderr.on('data', (chunk) => {
  output += chunk;
});

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early with ${server.exitCode}: ${output}`);
    }

    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the server has bound the port.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`server did not become healthy: ${output}`);
}

try {
  await waitForServer();

  const health = await fetch(`${baseUrl}/healthz`);
  assert.equal(health.status, 200);
  assert.equal(await health.text(), 'ok');

  const home = await fetch(`${baseUrl}/`);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type') ?? '', /^text\/html/);
  const html = await home.text();
  assert.match(html, /AKP Architekten/);
  assert.match(html, /<script type="module"[^>]*>/);

  const spaRoute = await fetch(`${baseUrl}/kontakt`);
  assert.equal(spaRoute.status, 200);
  assert.match(await spaRoute.text(), /AKP Architekten/);

  const image = await fetch(`${baseUrl}/images/cover-building.jpg`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/jpeg');

  const missingImage = await fetch(`${baseUrl}/images/does-not-exist.jpg`);
  assert.equal(missingImage.status, 404);
} finally {
  server.kill('SIGTERM');
  await once(server, 'exit').catch(() => {});
}
