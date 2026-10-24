# BrandHub demo media and website uploads

The demo catalog uses optimized files in `client/public/demo-media/` and metadata in MongoDB Atlas `brandhub_demo`. Website uploads made through `/app/media/upload` stream into the `brandhubUploads` GridFS bucket. The older design-review asset flow remains available at `/app/assets` for existing Phase 4 work.

## Local demo catalog

`client/public/demo-media-manifest.json` maps 26 files from the supplied ZIP to six verified product categories: beauty, beverages, electronics, fashion, furniture, and shoes. It contains 14 WebP images and 12 browser-compatible MP4 videos, totaling approximately 29 MB. Posters are stored beside the videos. The original ZIP and extracted source files are not deleted. The production client build copies the demo files as static assets.

Run `npm run media:prepare-local --workspace @brandhub/server` when regenerating optimized files from the extracted archive. Place the original files in `.tmp/brandhub-feed/` or set `BRANDHUB_MEDIA_DIR` to the extracted directory. Do not commit or redistribute the source archive without confirming media rights.

## Atlas demo records

Set `MONGODB_URI` in the ignored `server/.env` to an Atlas connection string whose database path is `/brandhub_demo`. Set `DEMO_USER_PASSWORD` and `ADMIN_PASSWORD` there as well. Use `npm run seed:brandhub:dry-run --workspace @brandhub/server`, then `npm run seed:brandhub --workspace @brandhub/server`. The seed is idempotent and uses fictional `@brandhub.example` accounts. Run `npm run verify:brandhub-seed --workspace @brandhub/server` after seeding or restarting. Never paste credentials into an issue or commit them.

The seed completed on 2026-10-24: 15 clients, 8 designers, 1 admin, 15 brands, 30 projects, 30 campaigns, and 26 media records. Independent verification found zero orphan projects and zero orphan media records. The demo admin email is `admin@brandhub.example`; its generated password is held only in the ignored `server/.env`.

## GridFS uploads

Authenticated project members can upload PNG, JPEG, WebP, MP4, or WebM files via `/api/media/upload?projectId=<id>`. The request requires a CSRF token and an exact `X-Upload-Size` byte count. Images are limited to 5 MB and videos to 20 MB by default. The server checks file signatures, validates project membership, reserves storage budget atomically, and writes bytes to GridFS through a stream. Metadata is saved in `MediaAsset`. Download endpoints enforce the same project access and support HTTP byte ranges for video playback. Users can edit their own upload metadata and delete eligible drafts; approved files cannot be deleted through this endpoint. Admins can inspect `/api/media/usage`.

`GRIDFS_UPLOAD_BUDGET_BYTES` defaults to 250 MB to leave headroom in a small Atlas deployment. Keep the original archive outside MongoDB. Existing Cloudinary copies from the earlier import remain in the account but are not referenced by the new demo catalog and were not deleted.

## Verification performed

- GridFS integration tests: upload, project access, full and partial retrieval, invalid range, deletion, quota release, invalid file, and oversized declaration passed.
- Server lint and client production build passed.
- Atlas seed verification passed with the counts above.
- Edge browser checks at 1440 px and 390 px loaded all 12 first-page images and video metadata from the second page, with no page errors or horizontal overflow. Screenshots are in `docs/screenshots/phase6-media-1440.png` and `phase6-media-390.png`.

For isolated local preview, set `VITE_API_PROXY_TARGET=http://127.0.0.1:5001` when running Vite on port 5174, and start the API with `PORT=5001` and `CLIENT_URL=http://127.0.0.1:5174`.
