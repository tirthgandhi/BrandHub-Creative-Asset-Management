import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gallery, categories } from '../src/data/gallery.ts';
test('client deliverables cover all five filters and refer to valid local artwork', async () => {
  assert.equal(gallery.length,16);
  for (const category of categories.slice(1)) assert.ok(gallery.some(item => item.category === category),category);
  for (const src of new Set(gallery.map(item => item.src).concat('/images/campaigns/cloud.png'))) {
    const bytes = await readFile(new URL(`../public${src}`,import.meta.url));
    assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],src);
  }
  assert.equal(new Set(gallery.map(item => item.id)).size,16);
  for (const item of gallery) { assert.ok(item.headline.trim()); assert.ok(item.alt.trim()); assert.ok(item.format.trim()); }
});
