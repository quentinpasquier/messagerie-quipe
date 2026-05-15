import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { StatusProvider } from "@/components/StatusProvider";
import { NotificationProvider } from "@/components/NotificationProvider";

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
        include: {
          user: { select: { id: true, name: true, image: true, status: true } },
        },
      },
    },
  });

  const users = await prisma.user.findMany({
    where: { id: { not: me.id } },
    select: { id: true, name: true, email: true, image: true, status: true },
    orderBy: { name: "asc" },
  });

  const dmList = dms.map((dm) => {
    const other = dm.members.find((m) => m.userId !== me.id);
    return {
      channelId: dm.id,
      userId: other?.userId ?? "",
      name: other?.user.name ?? "?",
      image: other?.user.image ?? null,
    };
  });

  const initialStatuses: Record<string, string> = { [me.id]: me.status };
  for (const u of users) initialStatuses[u.id] = u.status;
  for (const dm of dms) {
    for (const m of dm.members) initialStatuses[m.userId] = m.user.status;
  }

  return (
    <StatusProvider initial={initialStatuses}>
      <NotificationProvider meId={me.id}>
        <div className="flex h-screen w-screen overflow-hidden bg-noxias-bg">
          <Sidebar
            me={{
              id: me.id,
              name: me.name,
              email: me.email,
              image: me.image,
            }}
            channels={channels}
            dms={dmList}
            users={users}
          />
          <main className="flex-1 flex flex-col min-w-0">{children}</main>
        </div>
      </NotificationProvider>
    </StatusProvider>
  );
}
