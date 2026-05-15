import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { broadcastUserStatus } from "@/lib/realtime";

const VALID = new Set(["ONLINE", "BUSY", "AWAY"]);

export async function PATCH(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const status = String(body?.status ?? "");
  if (!VALID.has(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: me.id }, data: { status } });
  broadcastUserStatus(me.id, status);
  return NextResponse.json({ status });
}
