import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gallery, heroGallery, visionGallery, editorialMedia, categories } from '../src/data/gallery.ts';
test('client deliverables cover all five filters and refer to valid local artwork', async () => {
  assert.equal(gallery.length,16);
  for (const category of categories.slice(1)) assert.ok(gallery.some(item => item.category === category),category);
  for (const src of new Set(gallery.map(item => item.src).concat('/images/campaigns/cloud.png'))) {
    const bytes = await readFile(new URL(`../public${src}`,import.meta.url));
    assert.ok(bytes.length > 32, src);
  }
  assert.equal(new Set(gallery.map(item => item.id)).size,16);
  assert.equal(new Set([...heroGallery,...visionGallery,...gallery,...editorialMedia].map(item=>item.src)).size,25);
  for (const item of gallery.filter(item=>item.videoSrc)) assert.ok((await readFile(new URL(`../public${item.videoSrc}`,import.meta.url))).length>32);
  for (const item of gallery) { assert.ok(item.headline.trim()); assert.ok(item.alt.trim()); assert.ok(item.format.trim()); }
});
