"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

type Channel = { id: string; name: string };
type DM = { channelId: string; userId: string; name: string };
type Me = { id: string; name: string; email: string };

export function Sidebar({
  me,
  channels,
  dms,
  users,
}: {
  me: Me;
  channels: Channel[];
  dms: DM[];
  users: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const params = useParams();
  const currentId = (params?.id as string | undefined) ?? "";
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      const { channel } = await res.json();
      setNewName("");
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

  const usersById = new Map(users.map((u) => [u.id, u]));
  const dmUserIds = new Set(dms.map((d) => d.userId));
  const otherUsers = users.filter((u) => !dmUserIds.has(u.id));

  return (
    <aside className="w-64 bg-sidebar text-gray-200 flex flex-col flex-shrink-0">
      <div className="px-4 py-3 border-b border-white/10">
        <div className="font-bold text-white">Mon équipe</div>
        <div className="text-xs text-gray-400 truncate">{me.name}</div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-5">
        <section>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Canaux
            </span>
            <button
              onClick={() => setCreating((v) => !v)}
              className="text-gray-400 hover:text-white text-lg leading-none"
              aria-label="Créer un canal"
              title="Créer un canal"
            >
              +
            </button>
          </div>
          {creating && (
            <form onSubmit={createChannel} className="px-2 mb-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="nom-du-canal"
                className="w-full rounded bg-white/10 px-2 py-1 text-sm text-white placeholder-gray-400 focus:outline-none"
              />
            </form>
          )}
          <ul>
            {channels.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/c/${c.id}`}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                    currentId === c.id
                      ? "bg-sidebarActive text-white"
                      : "hover:bg-sidebarHover text-gray-300"
                  }`}
                >
                  <span className="text-gray-400">#</span>
                  <span className="truncate">{c.name}</span>
                </Link>
              </li>
            ))}
            {channels.length === 0 && (
              <li className="px-2 py-1 text-xs text-gray-500">Aucun canal</li>
            )}
          </ul>
        </section>

        <section>
          <div className="px-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Messages directs
            </span>
          </div>
          <ul>
            {dms.map((d) => (
              <li key={d.channelId}>
                <Link
                  href={`/c/${d.channelId}`}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                    currentId === d.channelId
                      ? "bg-sidebarActive text-white"
                      : "hover:bg-sidebarHover text-gray-300"
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="truncate">{d.name}</span>
                </Link>
              </li>
            ))}
            {dms.length === 0 && (
              <li className="px-2 py-1 text-xs text-gray-500">
                Démarre une conversation
              </li>
            )}
          </ul>
        </section>

        {otherUsers.length > 0 && (
          <section>
            <div className="px-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Coéquipiers
              </span>
            </div>
            <ul>
              {otherUsers.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => openDM(u.id)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-sidebarHover text-gray-300"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-500" />
                    <span className="truncate">{u.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="border-t border-white/10 px-3 py-2">
        <button
          onClick={logout}
          className="text-xs text-gray-400 hover:text-white"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
