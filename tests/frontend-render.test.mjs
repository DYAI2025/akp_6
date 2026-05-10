import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

let App;
let tempDir;

before(async () => {
  tempDir = join(process.cwd(), '.tmp-tests', `frontend-${process.pid}`);
  await mkdir(tempDir, { recursive: true });
  const outfile = join(tempDir, 'app-bundle.mjs');

  await build({
    entryPoints: [join(process.cwd(), 'src', 'App.tsx')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    sourcemap: false,
    external: ['react', 'react-dom', 'react-dom/server'],
  });

  ({ default: App } = await import(`file://${outfile}`));
});

after(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('initial frontend render exposes the cover content and image alternatives', () => {
  const html = renderToStaticMarkup(createElement(App));

  assert.match(html, /AKP Architekten/);
  assert.match(html, /Architektur und Generalplanung aus Berlin/);
  assert.match(html, /Projektvisualisierung aus dem AKP-Archiv/);
  assert.match(html, /Scrollen oder klicken zum Öffnen/);
});
