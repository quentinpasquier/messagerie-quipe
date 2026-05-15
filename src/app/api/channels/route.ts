import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rawName = String(body?.name ?? "").trim().toLowerCase();
  const name = rawName.replace(/\s+/g, "-").replace(/[^a-z0-9-éèêëàâäîïôöùûüç]/g, "");
  const description = body?.description ? String(body.description).trim() : null;

  if (!name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const existing = await prisma.channel.findFirst({
    where: { name, type: "PUBLIC" },
  });
  if (existing) {
    return NextResponse.json({ error: "Un canal avec ce nom existe déjà" }, { status: 409 });
  }

  const channel = await prisma.channel.create({
    data: {
      name,
      description,
      type: "PUBLIC",
      members: { create: { userId: user.id } },
    },
  });

  // Ajoute tous les utilisateurs existants au canal public (équipe unique).
  const others = await prisma.user.findMany({
    where: { id: { not: user.id } },
    select: { id: true },
  });
  if (others.length > 0) {
    await prisma.channelMember.createMany({
      data: others.map((u) => ({ userId: u.id, channelId: channel.id })),
    });
  }

  return NextResponse.json({ channel });
}
