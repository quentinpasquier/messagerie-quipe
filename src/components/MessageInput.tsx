"use client";

import { useRef, useState } from "react";

export function MessageInput({
  onSend,
  onTyping,
  placeholder,
}: {
  onSend: (content: string) => Promise<void> | void;
  onTyping?: () => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const lastTypingRef = useRef(0);

  async function submit() {
    const v = value.trim();
    if (!v || sending) return;
    setSending(true);
    setValue("");
    try {
      await onSend(v);
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

  return (
    <div className="border border-gray-300 rounded-lg focus-within:border-gray-400 bg-white">
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none px-3 py-2 text-sm focus:outline-none rounded-lg"
      />
      <div className="flex justify-end px-2 pb-2">
        <button
          onClick={submit}
          disabled={!value.trim() || sending}
          className="text-sm bg-accent text-white px-3 py-1 rounded disabled:opacity-40 hover:bg-emerald-700"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
