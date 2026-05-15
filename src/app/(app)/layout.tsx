import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const channels = await prisma.channel.findMany({
    where: {
      type: "PUBLIC",
      members: { some: { userId: me.id } },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  const dms = await prisma.channel.findMany({
    where: {
      type: "DM",
      members: { some: { userId: me.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  const users = await prisma.user.findMany({
    where: { id: { not: me.id } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const dmList = dms.map((dm) => {
    const other = dm.members.find((m) => m.userId !== me.id);
    return {
      channelId: dm.id,
      userId: other?.userId ?? "",
      name: other?.user.name ?? "?",
    };
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar
        me={{ id: me.id, name: me.name, email: me.email }}
        channels={channels}
        dms={dmList}
        users={users}
      />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
