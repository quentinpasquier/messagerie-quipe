import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { getUploadDir, MIME_BY_EXT } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filename = params.filename;
  if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const filepath = path.join(getUploadDir(), filename);
  try {
    await stat(filepath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  const buf = await readFile(filepath);
  const ext = filename.split(".").pop()!.toLowerCase();
  const mime = MIME_BY_EXT[ext] || "application/octet-stream";
  return new NextResponse(buf, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
