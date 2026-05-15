"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";

type Me = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

const INPUT = "w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-noxias-green focus:ring-1 focus:ring-noxias-green";

export function SettingsForm({ me }: { me: Me }) {
  const router = useRouter();
  const [name, setName] = useState(me.name);
  const [image, setImage] = useState<string | null>(me.image);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "Erreur upload" });
        return;
      }
      const patch = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: data.url }),
      });
      if (!patch.ok) {
        const err = await patch.json().catch(() => ({}));
        setMsg({ type: "err", text: err.error || "Erreur sauvegarde" });
        return;
      }
      setImage(data.url);
      setMsg({ type: "ok", text: "Belle photo, tu vas closer." });
      router.refresh();
    } catch {
      setMsg({ type: "err", text: "Réseau dans les choux" });
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    setMsg(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: null }),
    });
    if (res.ok) {
      setImage(null);
      setMsg({ type: "ok", text: "Photo retirée" });
      router.refresh();
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (name !== me.name) body.name = name;
      if (newPassword) {
        body.newPassword = newPassword;
        body.currentPassword = currentPassword;
      }
      if (Object.keys(body).length === 0) {
        setMsg({ type: "err", text: "Rien n'a changé." });
        return;
      }
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "Erreur" });
        return;
      }
      setMsg({ type: "ok", text: "Profil mis à jour. Tu es prêt à closer." });
      setNewPassword("");
      setCurrentPassword("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold mb-3 text-gray-900">Photo de profil</h2>
        <div className="flex items-center gap-4">
          <Avatar
            user={{ id: me.id, name, image }}
            size="lg"
            ringClass="ring-white"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {uploading ? "Upload..." : "Changer la photo"}
            </button>
            {image && (
              <button
                type="button"
                onClick={removeAvatar}
                className="text-xs text-gray-500 hover:text-red-600 text-left"
              >
                Retirer la photo
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={uploadAvatar}
              className="hidden"
            />
          </div>
        </div>
      </section>

      <form onSubmit={save} className="space-y-6">
        <section>
          <h2 className="font-semibold mb-3 text-gray-900">Informations</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Nom
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={me.email}
                disabled
                className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                L'email est gravé dans le marbre.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-3 text-gray-900">Mot de passe</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                className={INPUT}
              />
              <p className="text-xs text-gray-500 mt-1">
                Laisse vide pour garder l'ancien.
              </p>
            </div>
          </div>
        </section>

        {msg && (
          <p
            className={`text-sm ${
              msg.type === "ok" ? "text-noxias-greenDark" : "text-red-600"
            }`}
          >
            {msg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-noxias-green text-noxias-bg font-semibold px-4 py-2 rounded hover:bg-noxias-greenDark disabled:opacity-50 transition-colors"
        >
          {saving ? "..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
