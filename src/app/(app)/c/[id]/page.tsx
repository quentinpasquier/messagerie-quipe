import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ChannelView } from "@/components/ChannelView";

export default async function ChannelPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getCurrentUser();
  if (!me) return null;

  const channel = await prisma.channel.findFirst({
    where: {
      id: params.id,
      members: { some: { userId: me.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!channel) notFound();

  let displayName = channel.name;
  let isDM = channel.type === "DM";
  if (isDM) {
    const other = channel.members.find((m) => m.userId !== me.id);
    displayName = other?.user.name ?? channel.name;
  }

  return (
    <ChannelView
      me={{ id: me.id, name: me.name }}
      channel={{
        id: channel.id,
        name: displayName,
        description: channel.description,
        emoji: channel.emoji,
        isDM,
      }}
    />
  );
}
