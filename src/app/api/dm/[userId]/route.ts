import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Trouve ou crée un canal DM entre l'utilisateur courant et :userId.
export async function POST(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (params.userId === me.id) {
    return NextResponse.json({ error: "Impossible de DM soi-même" }, { status: 400 });
  }

  const other = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!other) return NextResponse.json({ error: "User introuvable" }, { status: 404 });

  // Cherche un DM contenant exactement ces deux utilisateurs.
  const candidates = await prisma.channel.findMany({
    where: {
      type: "DM",
      members: { some: { userId: me.id } },
      AND: [{ members: { some: { userId: other.id } } }],
    },
    include: { members: true },
  });

  let dm = candidates.find((c) => c.members.length === 2) ?? null;

  if (!dm) {
    dm = await prisma.channel.create({
      data: {
        name: `dm-${me.id}-${other.id}`,
        type: "DM",
        members: {
          create: [{ userId: me.id }, { userId: other.id }],
        },
      },
      include: { members: true },
    });
  }

  return NextResponse.json({ channelId: dm.id });
}
