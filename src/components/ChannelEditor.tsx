"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTED_EMOJIS = [
  "🎯", "💰", "🚀", "📈", "💼", "🔥", "🏆", "📞",
  "💸", "✨", "🤝", "🎉", "📊", "🥂", "☕", "🍕",
];

export function ChannelEditor({
  channelId,
  name,
  emoji,
  description,
  onClose,
}: {
  channelId: string;
  name: string;
  emoji: string | null;
  description: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [emojiInput, setEmojiInput] = useState(emoji ?? "");
  const [nameInput, setNameInput] = useState(name);
  const [descInput, setDescInput] = useState(description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput,
          emoji: emojiInput || null,
          description: descInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={ref}
      className="absolute top-full left-5 mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-96"
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Emoji
          </label>
          <div className="flex gap-2">
            <input
              value={emojiInput}
              onChange={(e) => setEmojiInput(e.target.value)}
              placeholder="🎯"
              maxLength={8}
              className="w-14 text-center text-lg rounded border border-gray-300 px-2 py-1 focus:outline-none focus:border-noxias-green"
            />
            <div className="flex flex-wrap gap-1 items-center">
              {SUGGESTED_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmojiInput(e)}
                  className="hover:bg-gray-100 rounded px-1 text-lg leading-none"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nom
          </label>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-noxias-green"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Description
          </label>
          <input
            value={descInput}
            onChange={(e) => setDescInput(e.target.value)}
            placeholder="À quoi sert ce canal ?"
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-noxias-green"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800 px-2"
          >
            Annuler
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="text-sm bg-noxias-green text-noxias-bg font-semibold px-3 py-1 rounded disabled:opacity-50 hover:bg-noxias-greenDark"
          >
            {saving ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
