"use client";

import { useRef, useState } from "react";

export function MessageInput({
  onSend,
  onTyping,
  placeholder,
}: {
  onSend: (content: string, imageUrl?: string | null) => Promise<void> | void;
  onTyping?: () => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastTypingRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const v = value.trim();
    if ((!v && !pendingImage) || sending) return;
    setSending(true);
    const imageUrl = pendingImage;
    setValue("");
    setPendingImage(null);
    try {
      await onSend(v, imageUrl);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
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
    <div className="border border-noxias-border rounded-lg focus-within:border-noxias-green bg-noxias-surface transition-colors">
      {pendingImage && (
        <div className="px-2 pt-2 flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pendingImage}
            alt=""
            className="max-h-32 rounded border border-noxias-border"
          />
          <button
            onClick={() => setPendingImage(null)}
            className="text-xs text-noxias-textMuted hover:text-red-400"
            title="Retirer"
          >
            ✕
          </button>
        </div>
      )}
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none px-3 py-2 text-sm focus:outline-none rounded-lg bg-transparent text-white placeholder-noxias-textMuted"
      />
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || sending}
            className="text-noxias-textMuted hover:text-noxias-green disabled:opacity-50"
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
            <span className="text-xs text-noxias-textMuted">
              Upload en cours...
            </span>
          )}
          {error && <span className="text-xs text-red-400">{error}</span>}
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
  );
}
