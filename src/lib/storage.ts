import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
}

export async function ensureUploadDir(): Promise<void> {
  const dir = getUploadDir();
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export type UploadResult = { url: string; filename: string };

export async function saveImage(file: File): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Fichier trop volumineux (max 5 Mo)");
  }
  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    throw new Error("Format non supporté (jpg, png, webp, gif uniquement)");
  }
  await ensureUploadDir();
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(getUploadDir(), filename), buffer);
  return { url: `/api/uploads/${filename}`, filename };
}

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};
