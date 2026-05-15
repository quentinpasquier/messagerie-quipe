"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_COLOR, STATUS_LABEL } from "./Avatar";
import { useStatus } from "./StatusProvider";

const OPTIONS = ["ONLINE", "BUSY", "AWAY"] as const;

export function StatusPicker({
  meId,
  customEmoji,
  customText,
}: {
  meId: string;
  customEmoji: string | null;
  customText: string | null;
}) {
  const router = useRouter();
  const current = useStatus(meId);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [emojiInput, setEmojiInput] = useState(customEmoji ?? "");
  const [textInput, setTextInput] = useState(customText ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEmojiInput(customEmoji ?? "");
    setTextInput(customText ?? "");
  }, [customEmoji, customText]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function setStatus(status: string) {
    setBusy(true);
    try {
      await fetch("/api/me/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function saveCustom() {
    setBusy(true);
    try {
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusEmoji: emojiInput || null,
          statusText: textInput || null,
        }),
      });
      setEditing(false);
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function clearCustom() {
    setBusy(true);
    try {
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusEmoji: null, statusText: null }),
      });
      setEmojiInput("");
      setTextInput("");
      setEditing(false);
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const hasCustom = Boolean(customEmoji || customText);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-noxias-textMuted hover:text-white max-w-full"
        disabled={busy}
      >
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[current] || STATUS_COLOR.OFFLINE}`}
        />
        {hasCustom ? (
          <span className="truncate">
            {customEmoji ? <span className="mr-0.5">{customEmoji}</span> : null}
            {customText || STATUS_LABEL[current]}
          </span>
        ) : (
          <span>{STATUS_LABEL[current] || current}</span>
        )}
        <span className="text-noxias-textMuted">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded shadow-lg border border-gray-200 py-1 z-20 w-64">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setStatus(opt)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[opt]}`} />
              {STATUS_LABEL[opt]}
            </button>
          ))}
          <div className="border-t border-gray-200 my-1" />
          {editing ? (
            <div className="px-3 py-2 space-y-2">
              <div className="flex gap-2">
                <input
                  value={emojiInput}
                  onChange={(e) => setEmojiInput(e.target.value)}
                  placeholder="😎"
                  maxLength={8}
                  className="w-12 text-center rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-noxias-green"
                />
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Sur un closing à 50K..."
                  maxLength={80}
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-noxias-green"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                {hasCustom && (
                  <button
                    onClick={clearCustom}
                    className="text-xs text-gray-500 hover:text-red-600"
                  >
                    Effacer
                  </button>
                )}
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={saveCustom}
                  disabled={busy}
                  className="text-xs bg-noxias-green text-noxias-bg font-semibold px-2 py-1 rounded disabled:opacity-50"
                >
                  OK
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
            >
              {hasCustom ? "Modifier le statut perso" : "Ajouter un statut perso"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
