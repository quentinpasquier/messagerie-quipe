import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { password: _omit, ...rest } = me;
  return NextResponse.json({ user: rest });
}

export async function PATCH(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const updates: {
    name?: string;
    image?: string | null;
    password?: string;
    statusEmoji?: string | null;
    statusText?: string | null;
  } = {};

  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    updates.name = name;
  }

  if (body?.image !== undefined) {
    updates.image = body.image ? String(body.image) : null;
  }

  if (body?.statusEmoji !== undefined) {
    const v = body.statusEmoji ? String(body.statusEmoji).trim().slice(0, 8) : null;
    updates.statusEmoji = v || null;
  }
  if (body?.statusText !== undefined) {
    const v = body.statusText ? String(body.statusText).trim().slice(0, 80) : null;
    updates.statusText = v || null;
  }

  if (body?.newPassword) {
    const newPwd = String(body.newPassword);
    if (newPwd.length < 6) {
      return NextResponse.json(
        { error: "Mot de passe trop court (6+ caractères)" },
        { status: 400 }
      );
    }
    const currentPwd = String(body.currentPassword || "");
    const ok = await bcrypt.compare(currentPwd, me.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 400 }
      );
    }
    updates.password = await bcrypt.hash(newPwd, 10);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id: me.id }, data: updates });
  const { password: _omit, ...rest } = user;
  return NextResponse.json({ user: rest });
}
