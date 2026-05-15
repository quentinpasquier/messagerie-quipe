"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SimpleUser } from "./UsersProvider";

export function MessageInput({
  onSend,
  onTyping,
  placeholder,
  mentionUsers = [],
}: {
  onSend: (content: string, imageUrl?: string | null) => Promise<void> | void;
  onTyping?: () => void;
  placeholder?: string;
  mentionUsers?: SimpleUser[];
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const lastTypingRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return mentionUsers
      .filter((u) => u.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, mentionUsers]);

  useEffect(() => {
    if (mentionIndex >= suggestions.length) setMentionIndex(0);
  }, [suggestions.length, mentionIndex]);

  async function submit() {
    const v = value.trim();
    if ((!v && !pendingImage) || sending) return;
    setSending(true);
    const imageUrl = pendingImage;
    setValue("");
    setPendingImage(null);
    setMentionQuery(null);
    try {
      await onSend(v, imageUrl);
    } finally {
      setSending(false);
    }
  }

  function detectMention(text: string, caret: number): string | null {
    const before = text.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at === -1) return null;
    // pas d'@ collé à un mot précédent (e.g. email)
    if (at > 0 && /[^\s]/.test(before[at - 1])) return null;
    const after = before.slice(at + 1);
    if (/\s/.test(after)) return null;
    if (after.length > 30) return null;
    return after;
  }

  function applyMention(user: SimpleUser) {
    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const at = before.lastIndexOf("@");
    if (at === -1) return;
    const inserted = `@${user.name} `;
    const newValue = before.slice(0, at) + inserted + after;
    setValue(newValue);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      const pos = at + inserted.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyMention(suggestions[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValue(v);
    const caret = e.target.selectionStart ?? v.length;
    setMentionQuery(detectMention(v, caret));
    setMentionIndex(0);
    if (onTyping) {
      const now = Date.now();
      if (now - lastTypingRef.current > 1500) {
        lastTypingRef.current = now;
        onTyping();
      }
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur upload");
        return;
      }
      setPendingImage(data.url);
    } catch {
      setError("Réseau dans les choux");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative">
      {suggestions.length > 0 && mentionQuery !== null && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
          {suggestions.map((u, i) => (
            <button
              key={u.id}
              onMouseDown={(e) => {
                e.preventDefault();
                applyMention(u);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                i === mentionIndex ? "bg-noxias-green/10" : "hover:bg-gray-50"
              }`}
            >
              <span className="text-noxias-greenDark font-semibold">@</span>
              <span className="text-gray-900">{u.name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="border border-gray-300 rounded-lg focus-within:border-noxias-green focus-within:ring-1 focus-within:ring-noxias-green bg-white transition-colors">
        {pendingImage && (
          <div className="px-2 pt-2 flex items-start gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage}
              alt=""
              className="max-h-32 rounded border border-gray-200"
            />
            <button
              onClick={() => setPendingImage(null)}
              className="text-xs text-gray-500 hover:text-red-600"
              title="Retirer"
            >
              ✕
            </button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none px-3 py-2 text-sm focus:outline-none rounded-lg bg-transparent text-gray-900 placeholder-gray-400"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || sending}
              className="text-gray-500 hover:text-noxias-greenDark disabled:opacity-50"
              title="Joindre une image"
            >
              📎
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onFile}
              className="hidden"
            />
            {uploading && (
              <span className="text-xs text-gray-500">Upload en cours...</span>
            )}
            {error && <span className="text-xs text-red-600">{error}</span>}
            {mentionUsers.length > 0 && !uploading && !error && (
              <span className="text-xs text-gray-400">
                Tape @ pour mentionner
              </span>
            )}
          </div>
          <button
            onClick={submit}
            disabled={(!value.trim() && !pendingImage) || sending || uploading}
            className="text-sm bg-noxias-green text-noxias-bg font-semibold px-3 py-1 rounded disabled:opacity-40 hover:bg-noxias-greenDark transition-colors"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
