"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "./Avatar";
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

const APP_LINKS: { name: string; url: string; icon: React.ReactNode }[] = [
  {
    name: "Dashboard",
    url: "https://dashboardnoxias.vercel.app/clients",
    icon: <DashboardIcon />,
  },
  {
    name: "Coaching",
    url: "https://bizcoachnoxias.vercel.app/dashboard",
    icon: <TrophyIcon />,
  },
  {
    name: "Espace client",
    url: "https://espace-client-noxias.fr/",
    icon: <BuildingIcon />,
  },
];

function DashboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M12 6h.01M16 6h.01" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
      <path d="M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

const ITEM_BASE =
  "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors";
const ITEM_ACTIVE =
  "bg-noxias-green/15 text-noxias-greenDark font-semibold";
const ITEM_UNREAD = "text-gray-900 font-bold hover:bg-gray-100";
const ITEM_DEFAULT = "text-gray-700 hover:bg-gray-100";

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="bg-noxias-green text-noxias-bg text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] grid place-items-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function ChannelRow({ channel, active }: { channel: Channel; active: boolean }) {
  const unread = useUnread(channel.id);
  const hasUnread = unread > 0 && !active;
  const cls = active ? ITEM_ACTIVE : hasUnread ? ITEM_UNREAD : ITEM_DEFAULT;
  return (
    <Link href={`/c/${channel.id}`} className={`${ITEM_BASE} ${cls}`}>
      <span
        className={`w-5 text-center text-base leading-none ${
          channel.emoji ? "" : active ? "text-noxias-greenDark" : "text-gray-400"
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
  const cls = active ? ITEM_ACTIVE : hasUnread ? ITEM_UNREAD : ITEM_DEFAULT;
  return (
    <Link href={`/c/${dm.channelId}`} className={`${ITEM_BASE} ${cls}`}>
      <Avatar
        user={{ id: dm.userId, name: dm.name, image: dm.image }}
        size="sm"
        ringClass="ring-gray-50"
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
      className={`${ITEM_BASE} ${ITEM_DEFAULT} w-full text-left`}
    >
      <Avatar
        user={{ id: user.id, name: user.name, image: user.image }}
        size="sm"
        ringClass="ring-gray-50"
      />
      <span className="truncate">{user.name}</span>
    </button>
  );
}

function AppLink({
  name,
  url,
  icon,
}: {
  name: string;
  url: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${ITEM_BASE} ${ITEM_DEFAULT} group`}
    >
      <span className="w-5 text-gray-500 group-hover:text-noxias-greenDark flex justify-center">
        {icon}
      </span>
      <span className="flex-1 truncate">{name}</span>
      <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalIcon />
      </span>
    </a>
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
    <aside className="w-64 bg-gray-50 border-r border-gray-200 text-gray-800 flex flex-col flex-shrink-0">
      <div className="px-4 py-3 bg-noxias-secondary border-b border-black/30">
        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-noxias-green text-lg tracking-tight">
            Noxias
          </span>
          <span className="text-xs text-gray-300">Chat</span>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-gray-200 flex items-center gap-2.5">
        <Link href="/settings" title="Modifier mon profil">
          <Avatar
            user={{ id: me.id, name: me.name, image: me.image }}
            size="md"
            ringClass="ring-gray-50"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 text-sm truncate">
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
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Canaux
            </span>
            <button
              onClick={() => setCreating((v) => !v)}
              className="text-gray-400 hover:text-noxias-greenDark text-lg leading-none"
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
                className="w-10 text-center rounded border border-gray-300 bg-white px-1 py-1 text-sm placeholder-gray-400 focus:outline-none focus:border-noxias-green"
              />
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex: team-closing"
                className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm placeholder-gray-400 focus:outline-none focus:border-noxias-green"
              />
            </form>
          )}
          <ul className="space-y-0.5">
            {channels.map((c) => (
              <li key={c.id}>
                <ChannelRow channel={c} active={currentId === c.id} />
              </li>
            ))}
            {channels.length === 0 && (
              <li className="px-3 py-1 text-xs text-gray-500 italic">
                Le pipe est vide.
              </li>
            )}
          </ul>
        </section>

        <section>
          <div className="px-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Messages directs
            </span>
          </div>
          <ul className="space-y-0.5">
            {dms.map((d) => (
              <li key={d.channelId}>
                <DMRow dm={d} active={currentId === d.channelId} />
              </li>
            ))}
            {dms.length === 0 && (
              <li className="px-3 py-1 text-xs text-gray-500 italic">
                Aucun follow-up en cours.
              </li>
            )}
          </ul>
        </section>

        {otherUsers.length > 0 && (
          <section>
            <div className="px-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                L&apos;équipe
              </span>
            </div>
            <ul className="space-y-0.5">
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

        <section>
          <div className="px-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Outils Noxias
            </span>
          </div>
          <ul className="space-y-0.5">
            {APP_LINKS.map((l) => (
              <li key={l.url}>
                <AppLink name={l.name} url={l.url} icon={l.icon} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="border-t border-gray-200 px-3 py-2 flex items-center justify-between gap-2">
        <Link
          href="/settings"
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          Profil
        </Link>
        <NotificationToggle />
        <button
          onClick={logout}
          className="text-xs text-gray-500 hover:text-gray-900"
          title="Fin de journée ?"
        >
          Déco
        </button>
      </div>
    </aside>
  );
}
