import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "FormData attendu" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  try {
    const { url } = await saveImage(file);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur upload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
