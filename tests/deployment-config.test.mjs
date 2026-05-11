import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('package scripts keep the Railway deployment path reproducible', async () => {
  const packageJson = await readJson('package.json');

  assert.equal(packageJson.scripts.start, 'node server.mjs');
  assert.equal(packageJson.scripts.build, 'vite build');
  assert.match(packageJson.scripts.ci, /npm run typecheck/);
  assert.match(packageJson.scripts.ci, /npm test/);
  assert.match(packageJson.scripts.ci, /npm run build/);
  assert.match(packageJson.scripts.ci, /npm run smoke/);
  assert.equal(packageJson.packageManager, 'npm@11.4.2');
  assert.equal(packageJson.engines.node, '20.x');
  assert.equal(packageJson.engines.npm, '>=11 <12');
});

test('Railway config builds the Vite app and validates the production server healthcheck', async () => {
  const railwayToml = await readFile('railway.toml', 'utf8');

  assert.match(railwayToml, /builder\s*=\s*"NIXPACKS"/);
  assert.match(railwayToml, /buildCommand\s*=\s*"npm run build"/);
  assert.doesNotMatch(railwayToml, /buildCommand\s*=\s*"npm ci && npm run build"/);
  assert.match(railwayToml, /startCommand\s*=\s*"npm start"/);
  assert.match(railwayToml, /healthcheckPath\s*=\s*"\/healthz"/);
});
