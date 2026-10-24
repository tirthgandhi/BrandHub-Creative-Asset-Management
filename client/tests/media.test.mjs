import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
const root = new URL("../public/", import.meta.url);
test("all 16 photos and four films have local files and source/license records", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("media-manifest.json", root), "utf8"),
  );
  assert.equal(manifest.filter((m) => m.provider === "Pexels").length, 16);
  assert.equal(manifest.filter((m) => m.provider === "Mixkit").length, 4);
  for (const item of manifest) {
    assert.match(item.source, /^https:\/\//);
    assert.match(item.license, /^https:\/\//);
    const file = new URL(item.path.slice(1), root);
    assert.ok((await stat(file)).size > 1000, item.path);
    if (item.poster)
      assert.ok((await stat(new URL(item.poster.slice(1), root))).size > 1000);
    else
      assert.ok(
        (
          await stat(
            new URL(item.path.slice(1).replace(".webp", "-small.webp"), root),
          )
        ).size > 1000,
      );
  }
});
