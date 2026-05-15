import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const USER_SELECT = { id: true, name: true, image: true, status: true } as const;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parent = await prisma.message.findUnique({
    where: { id: params.id },
    include: {
      user: { select: USER_SELECT },
      reactions: { include: { user: { select: { id: true, name: true } } } },
      linkPreviews: { orderBy: { fetchedAt: "asc" } },
      _count: { select: { replies: true } },
    },
  });
  if (!parent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: user.id, channelId: parent.channelId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const replies = await prisma.message.findMany({
    where: { parentId: params.id },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: USER_SELECT },
      reactions: { include: { user: { select: { id: true, name: true } } } },
      linkPreviews: { orderBy: { fetchedAt: "asc" } },
    },
  });

  return NextResponse.json({ parent, replies });
}
