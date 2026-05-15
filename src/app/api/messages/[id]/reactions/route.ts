import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emitToChannel } from "@/lib/realtime";

async function authorize(userId: string, messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, channelId: true },
  });
  if (!message) return null;
  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId, channelId: message.channelId } },
  });
  if (!membership) return null;
  return message;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const emoji = String(body?.emoji ?? "").trim();
  if (!emoji) return NextResponse.json({ error: "Emoji requis" }, { status: 400 });

  const message = await authorize(user.id, params.id);
  if (!message) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Toggle: si existe, supprimer ; sinon créer.
  const existing = await prisma.reaction.findUnique({
    where: {
      emoji_userId_messageId: {
        emoji,
        userId: user.id,
        messageId: params.id,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { emoji, userId: user.id, messageId: params.id },
    });
  }

  const reactions = await prisma.reaction.findMany({
    where: { messageId: params.id },
    include: { user: { select: { id: true, name: true } } },
  });

  emitToChannel(message.channelId, "reactions:update", {
    messageId: params.id,
    reactions,
  });

  return NextResponse.json({ reactions });
}
