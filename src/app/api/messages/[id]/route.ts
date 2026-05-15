import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emitToChannel } from "@/lib/realtime";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const message = await prisma.message.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, channelId: true, parentId: true },
  });
  if (!message) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (message.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.message.delete({ where: { id: params.id } });

  emitToChannel(message.channelId, "message:deleted", {
    messageId: message.id,
    channelId: message.channelId,
    parentId: message.parentId,
  });

  return NextResponse.json({ ok: true });
}
