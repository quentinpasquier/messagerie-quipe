import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const channel = await prisma.channel.findFirst({
    where: { id: params.id, type: "PUBLIC" },
  });
  if (!channel) {
    return NextResponse.json({ error: "Canal introuvable" }, { status: 404 });
  }

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: user.id, channelId: params.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const updates: { name?: string; description?: string | null; emoji?: string | null } = {};

  if (body?.name !== undefined) {
    const raw = String(body.name).trim().toLowerCase();
    const name = raw.replace(/\s+/g, "-").replace(/[^a-z0-9-éèêëàâäîïôöùûüç]/g, "");
    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }
    if (name !== channel.name) {
      const conflict = await prisma.channel.findFirst({
        where: { name, type: "PUBLIC", id: { not: params.id } },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Un canal porte déjà ce nom" },
          { status: 409 }
        );
      }
      updates.name = name;
    }
  }

  if (body?.description !== undefined) {
    const d = String(body.description ?? "").trim();
    updates.description = d || null;
  }

  if (body?.emoji !== undefined) {
    const e = body.emoji ? String(body.emoji).trim().slice(0, 8) : null;
    updates.emoji = e || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const updated = await prisma.channel.update({
    where: { id: params.id },
    data: updates,
  });
  return NextResponse.json({ channel: updated });
}
