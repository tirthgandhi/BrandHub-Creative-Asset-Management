import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { validateImage } from "../src/middleware/uploadValidation.js";
import { cloudinary } from "../src/config/cloudinary.js";
import { getSignedFileUrl, getSignedThumbnailUrl } from "../src/services/cloudinaryStorage.js";

test("validated image bytes must match type and extension", async () => {
  const buffer = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#369" } }).png().toBuffer();
  const accepted = await validateImage({ buffer, originalname: "asset.png", mimetype: "image/png" });
  assert.equal(accepted.format, "png");
  await assert.rejects(validateImage({ buffer, originalname: "asset.jpg", mimetype: "image/jpeg" }), (error) => error.status === 415);
  await assert.rejects(validateImage({ buffer: Buffer.from("not an image"), originalname: "asset.png", mimetype: "image/png" }), (error) => error.status === 415);
});

test("authenticated delivery links carry a short-lived access token", () => {
  const previous = process.env.CLOUDINARY_AUTH_TOKEN_KEY;
  cloudinary.config({ cloud_name: "example", api_key: "test", api_secret: "test-secret", secure: true });
  process.env.CLOUDINARY_AUTH_TOKEN_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  try {
    const file = { publicId: "brandhub/project/asset", storageVersion: 1, format: "png" };
    for (const signed of [getSignedFileUrl(file), getSignedThumbnailUrl(file)]) {
      assert.equal(new URL(signed.url).searchParams.has("__cld_token__"), true);
      const remaining = Date.parse(signed.expiresAt) - Date.now();
      assert.ok(remaining > 290_000 && remaining <= 300_000);
    }
  } finally { if (previous === undefined) delete process.env.CLOUDINARY_AUTH_TOKEN_KEY; else process.env.CLOUDINARY_AUTH_TOKEN_KEY = previous; }
});
