import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, before, after } from 'node:test';
import { build } from 'esbuild';

let moduleUnderTest;
let tempDir;

before(async () => {
  tempDir = join(tmpdir(), `akp-tests-${process.pid}`);
  await mkdir(tempDir, { recursive: true });
  const entry = join(tempDir, 'entry.ts');
  const outfile = join(tempDir, 'site-bundle.mjs');
  await import('node:fs/promises').then(({ writeFile }) => writeFile(entry, `export * from '${process.cwd()}/src/navigation.ts';\nexport * from '${process.cwd()}/src/siteData.ts';\n`));
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    sourcemap: false,
  });
  moduleUnderTest = await import(`file://${outfile}`);
});

after(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('page hashes resolve only to configured page ids', () => {
  const { getPageByHash } = moduleUnderTest;

  assert.equal(getPageByHash('#kontakt'), 'kontakt');
  assert.equal(getPageByHash('projekte'), 'projekte');
  assert.equal(getPageByHash('#unbekannt'), null);
  assert.equal(getPageByHash('../kontakt'), null);
});

test('project filters are case-insensitive and complete', () => {
  const { filterProjects, projects } = moduleUnderTest;

  assert.equal(filterProjects(projects, 'alle').length, projects.length);
  assert.deepEqual(
    filterProjects(projects, 'WOHNEN').map((project) => project.id),
    ['roelckestrasse', 'pestalozzistrasse', 'studinest', 'luetzufer']
  );
  assert.deepEqual(
    filterProjects(projects, 'sanierung').map((project) => project.id),
    ['pestalozzistrasse', 'jugendhotel', 'waldowstrasse', 'gaillard22']
  );
});

test('navigation and index data stay consistent', () => {
  const { pages, indexEntries } = moduleUnderTest;
  const pageIds = new Set(pages.map((page) => page.id));
  const duplicatePageIds = pages
    .map((page) => page.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

  assert.deepEqual(duplicatePageIds, []);
  assert.ok(pageIds.has('cover'));
  assert.ok(pageIds.has('impressum'));

  const indexedContentPageIds = new Set(indexEntries.map((entry) => entry.id));
  assert.deepEqual(
    pages.filter((page) => !['cover', 'index'].includes(page.id)).map((page) => page.id),
    indexEntries.map((entry) => entry.id),
    'index entries should expose every content page in page order'
  );

  for (const [index, entry] of indexEntries.entries()) {
    assert.equal(entry.number, String(index + 1).padStart(2, '0'), `index number for ${entry.id} must be sequential`);
    assert.ok(pageIds.has(entry.id), `index entry ${entry.id} must point to an existing page`);
    assert.notEqual(entry.id, 'cover', 'cover must not be listed as content chapter');
  }

  assert.ok(indexedContentPageIds.has('impressum'), 'impressum should be reachable from the index');
});

test('project data has unique ids and valid categories', () => {
  const { projects } = moduleUnderTest;
  const validCategories = new Set(['wohnen', 'gesundheit', 'gewerbe', 'bestand']);
  const ids = new Set();

  for (const project of projects) {
    assert.ok(!ids.has(project.id), `duplicate project id: ${project.id}`);
    ids.add(project.id);
    assert.ok(validCategories.has(project.category), `invalid category for ${project.id}`);
    assert.ok(project.title.trim(), `missing title for ${project.id}`);
    assert.ok(project.description.trim(), `missing description for ${project.id}`);
  }
});
