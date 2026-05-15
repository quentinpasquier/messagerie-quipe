import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const firstChannel = await prisma.channel.findFirst({
    where: { type: "PUBLIC", members: { some: { userId: user.id } } },
    orderBy: { createdAt: "asc" },
  });

  if (firstChannel) redirect(`/c/${firstChannel.id}`);
  redirect("/no-channels");
}
