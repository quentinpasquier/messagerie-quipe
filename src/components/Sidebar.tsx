"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, STATUS_COLOR } from "./Avatar";
import { StatusPicker } from "./StatusPicker";
import { useStatus } from "./StatusProvider";
import { useUnread } from "./NotificationProvider";
import { NotificationToggle } from "./NotificationToggle";

type Channel = { id: string; name: string; emoji: string | null };
type DM = {
  channelId: string;
  userId: string;
  name: string;
  image: string | null;
};
type SidebarUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  status: string;
};
type Me = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  statusEmoji: string | null;
  statusText: string | null;
};

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="bg-noxias-green text-noxias-bg text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] grid place-items-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function ChannelRow({
  channel,
  active,
}: {
  channel: Channel;
  active: boolean;
}) {
  const unread = useUnread(channel.id);
  const hasUnread = unread > 0 && !active;
  return (
    <Link
      href={`/c/${channel.id}`}
      className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
        active
          ? "bg-noxias-green text-noxias-bg font-semibold"
          : hasUnread
          ? "text-white font-bold hover:bg-sidebarHover"
          : "text-gray-300 hover:bg-sidebarHover"
      }`}
    >
      <span
        className={`w-5 text-center ${
          channel.emoji
            ? ""
            : active
            ? "text-noxias-bg"
            : hasUnread
            ? "text-white"
            : "text-gray-400"
        }`}
      >
        {channel.emoji || "#"}
      </span>
      <span className="flex-1 truncate">{channel.name}</span>
      <UnreadBadge count={hasUnread ? unread : 0} />
    </Link>
  );
}

function DMRow({ dm, active }: { dm: DM; active: boolean }) {
  const unread = useUnread(dm.channelId);
  const hasUnread = unread > 0 && !active;
  return (
    <Link
      href={`/c/${dm.channelId}`}
      className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
        active
          ? "bg-noxias-green text-noxias-bg font-semibold"
          : hasUnread
          ? "text-white font-bold hover:bg-sidebarHover"
          : "text-gray-300 hover:bg-sidebarHover"
      }`}
    >
      <Avatar
        user={{ id: dm.userId, name: dm.name, image: dm.image }}
        size="sm"
        ringClass={active ? "ring-noxias-green" : "ring-sidebar"}
      />
      <span className="flex-1 truncate">{dm.name}</span>
      <UnreadBadge count={hasUnread ? unread : 0} />
    </Link>
  );
}

function TeammateRow({
  user,
  onClick,
}: {
  user: { id: string; name: string; image: string | null };
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-sidebarHover text-gray-300"
    >
      <Avatar
        user={{ id: user.id, name: user.name, image: user.image }}
        size="sm"
        ringClass="ring-sidebar"
      />
      <span className="truncate">{user.name}</span>
    </button>
  );
}

export function Sidebar({
  me,
  channels,
  dms,
  users,
}: {
  me: Me;
  channels: Channel[];
  dms: DM[];
  users: SidebarUser[];
}) {
  const router = useRouter();
  const params = useParams();
  const currentId = (params?.id as string | undefined) ?? "";
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, emoji: newEmoji || null }),
    });
    if (res.ok) {
      const { channel } = await res.json();
      setNewName("");
      setNewEmoji("");
      setCreating(false);
      router.push(`/c/${channel.id}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erreur");
    }
  }

  async function openDM(userId: string) {
    const res = await fetch(`/api/dm/${userId}`, { method: "POST" });
    if (res.ok) {
      const { channelId } = await res.json();
      router.push(`/c/${channelId}`);
      router.refresh();
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const dmUserIds = new Set(dms.map((d) => d.userId));
  const otherUsers = users.filter((u) => !dmUserIds.has(u.id));

  return (
    <aside className="w-64 bg-sidebar text-gray-200 flex flex-col flex-shrink-0 border-r border-black/30">
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-noxias-green text-lg tracking-tight">
            Noxias
          </span>
          <span className="text-xs text-noxias-textMuted">Chat</span>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-white/10 flex items-center gap-2">
        <Link href="/settings" title="Modifier mon profil">
          <Avatar
            user={{ id: me.id, name: me.name, image: me.image }}
            size="md"
            ringClass="ring-sidebar"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white text-sm truncate">
            {me.name}
          </div>
          <StatusPicker
            meId={me.id}
            customEmoji={me.statusEmoji}
            customText={me.statusText}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-5">
        <section>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-noxias-textMuted">
              Canaux
            </span>
            <button
              onClick={() => setCreating((v) => !v)}
              className="text-noxias-textMuted hover:text-noxias-green text-lg leading-none"
              aria-label="Créer un canal"
              title="Lancer un nouveau canal"
            >
              +
            </button>
          </div>
          {creating && (
            <form onSubmit={createChannel} className="px-2 mb-2 flex gap-1">
              <input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                placeholder="🎯"
                maxLength={8}
                className="w-10 text-center rounded bg-white/10 px-1 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/20"
              />
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex: team-closing"
                className="flex-1 rounded bg-white/10 px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/20"
              />
            </form>
          )}
          <ul>
            {channels.map((c) => (
              <li key={c.id}>
                <ChannelRow channel={c} active={currentId === c.id} />
              </li>
            ))}
            {channels.length === 0 && (
              <li className="px-2 py-1 text-xs text-noxias-textMuted italic">
                Le pipe est vide.
              </li>
            )}
          </ul>
        </section>

        <section>
          <div className="px-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-noxias-textMuted">
              Messages directs
            </span>
          </div>
          <ul>
            {dms.map((d) => (
              <li key={d.channelId}>
                <DMRow dm={d} active={currentId === d.channelId} />
              </li>
            ))}
            {dms.length === 0 && (
              <li className="px-2 py-1 text-xs text-noxias-textMuted italic">
                Aucun follow-up en cours.
              </li>
            )}
          </ul>
        </section>

        {otherUsers.length > 0 && (
          <section>
            <div className="px-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-noxias-textMuted">
                L'équipe
              </span>
            </div>
            <ul>
              {otherUsers.map((u) => (
                <li key={u.id}>
                  <TeammateRow
                    user={{ id: u.id, name: u.name, image: u.image }}
                    onClick={() => openDM(u.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="border-t border-white/10 px-3 py-2 flex items-center justify-between gap-2">
        <Link
          href="/settings"
          className="text-xs text-noxias-textMuted hover:text-white"
        >
          Profil
        </Link>
        <NotificationToggle />
        <button
          onClick={logout}
          className="text-xs text-noxias-textMuted hover:text-white"
          title="Fin de journée ?"
        >
          Déco
        </button>
      </div>
    </aside>
  );
}
