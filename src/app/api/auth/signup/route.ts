import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !name || password.length < 6) {
    return NextResponse.json(
      { error: "Email, nom et mot de passe (6+ caractères) requis" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, password: hash },
  });

  // Ajouter le nouvel utilisateur à tous les canaux publics existants,
  // créer "général" si c'est le premier utilisateur.
  let general = await prisma.channel.findFirst({
    where: { name: "général", type: "PUBLIC" },
  });
  if (!general) {
    general = await prisma.channel.create({
      data: {
        name: "général",
        description: "Le QG. Tout le monde traîne ici.",
        type: "PUBLIC",
      },
    });
  }

  const publicChannels = await prisma.channel.findMany({
    where: { type: "PUBLIC" },
    select: { id: true },
  });
  await prisma.channelMember.createMany({
    data: publicChannels.map((c) => ({ userId: user.id, channelId: c.id })),
  });

  await createSession({ userId: user.id, email: user.email, name: user.name });

  return NextResponse.json({ ok: true });
}
