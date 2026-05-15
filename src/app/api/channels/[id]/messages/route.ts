import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emitToChannel, emitLinkPreviews } from "@/lib/realtime";
import { extractUrls, fetchLinkPreview } from "@/lib/link-preview";

const USER_SELECT = { id: true, name: true, image: true, status: true } as const;

async function processLinkPreviews(
  messageId: string,
  channelId: string,
  urls: string[]
) {
  for (const url of urls) {
    const preview = await fetchLinkPreview(url);
    if (!preview) continue;
    try {
      await prisma.linkPreview.create({
        data: {
          messageId,
          url: preview.url,
          title: preview.title,
          description: preview.description,
          image: preview.image,
          siteName: preview.siteName,
        },
      });
    } catch (e) {
      console.error("link preview save error:", e);
    }
  }
  try {
    const previews = await prisma.linkPreview.findMany({
      where: { messageId },
      orderBy: { fetchedAt: "asc" },
    });
    if (previews.length > 0) {
      emitLinkPreviews(channelId, messageId, previews);
    }
  } catch (e) {
    console.error("link preview emit error:", e);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: user.id, channelId: params.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { channelId: params.id, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: USER_SELECT },
      reactions: {
        include: { user: { select: { id: true, name: true } } },
      },
      linkPreviews: { orderBy: { fetchedAt: "asc" } },
      _count: { select: { replies: true } },
    },
    take: 200,
  });

  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const content = String(body?.content ?? "").trim();
  const imageUrl = body?.imageUrl ? String(body.imageUrl) : null;
  const parentId = body?.parentId ? String(body.parentId) : null;

  if (!content && !imageUrl) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: user.id, channelId: params.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parentId) {
    const parent = await prisma.message.findFirst({
      where: { id: parentId, channelId: params.id },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent introuvable" }, { status: 400 });
    }
  }

  const message = await prisma.message.create({
    data: {
      content,
      imageUrl,
      userId: user.id,
      channelId: params.id,
      parentId,
    },
    include: {
      user: { select: USER_SELECT },
      reactions: { include: { user: { select: { id: true, name: true } } } },
      linkPreviews: true,
      _count: { select: { replies: true } },
    },
  });

  emitToChannel(params.id, "message:new", message);

  const urls = content ? extractUrls(content) : [];
  if (urls.length > 0) {
    void processLinkPreviews(message.id, params.id, urls);
  }

  return NextResponse.json({ message });
}
