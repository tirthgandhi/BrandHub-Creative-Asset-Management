import path from "node:path";
import multer from "multer";
import sharp from "sharp";
import { AppError } from "../utils/AppError.js";

const maxBytes = 5 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxBytes, files: 1, fields: 8, parts: 9 } }).single("file");

export function receiveImage(req, res, next) {
  upload(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") return next(new AppError(413, "PAYLOAD_TOO_LARGE", "Image must be 5 MB or smaller"));
    return next(new AppError(400, "BAD_REQUEST", "Invalid image upload"));
  });
}

export async function validateImage(file) {
  if (!file?.buffer?.length) throw new AppError(422, "VALIDATION_ERROR", "Choose an image to upload");
  const bytes = file.buffer;
  const jpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  const format = jpg ? "jpg" : png ? "png" : webp ? "webp" : null;
  const extensions = { jpg: [".jpg", ".jpeg"], png: [".png"], webp: [".webp"] };
  const mimes = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
  if (!format || !extensions[format].includes(path.extname(file.originalname).toLowerCase()) || file.mimetype !== mimes[format]) throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Use a JPEG, PNG, or WebP image with a matching filename");
  try {
    const pipeline = sharp(bytes, { limitInputPixels: 80_000_000, failOn: "error" });
    const metadata = await pipeline.metadata();
    if (metadata.format !== (format === "jpg" ? "jpeg" : format) || !metadata.width || !metadata.height || metadata.width > 12000 || metadata.height > 12000) throw new Error("Invalid dimensions or format");
    await pipeline.stats();
    return { format, width: metadata.width, height: metadata.height, bytes: bytes.length };
  } catch {
    throw new AppError(422, "VALIDATION_ERROR", "The image file is damaged or too large to process");
  }
}
