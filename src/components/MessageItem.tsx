"use client";

import { useState } from "react";
import type { MessageDTO } from "@/types/message";

const QUICK_EMOJIS = ["👍", "❤️", "😄", "🎉", "👀", "🚀"];

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeFmt(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageItem({
  message,
  meId,
  onReact,
  onOpenThread,
  compact = false,
}: {
  message: MessageDTO;
  meId: string;
  onReact: (messageId: string, emoji: string) => void;
  onOpenThread?: () => void;
  compact?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);

  // Regroupe les réactions par emoji
  const grouped = message.reactions.reduce<Record<string, typeof message.reactions>>(
    (acc, r) => {
      (acc[r.emoji] ||= []).push(r);
      return acc;
    },
    {}
  );

  return (
    <li className="group relative flex gap-3 px-2 py-1.5 rounded hover:bg-gray-50">
      <div className="flex-shrink-0 w-9 h-9 rounded bg-gradient-to-br from-purple-500 to-pink-500 text-white grid place-items-center text-xs font-bold">
        {initials(message.user.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-sm">{message.user.name}</span>
          <span className="text-xs text-gray-500">
            {timeFmt(message.createdAt)}
          </span>
        </div>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {Object.keys(grouped).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(grouped).map(([emoji, list]) => {
              const mine = list.some((r) => r.userId === meId);
              const title = list.map((r) => r.user.name).join(", ");
              return (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  title={title}
                  className={`text-xs px-1.5 py-0.5 rounded-full border ${
                    mine
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {emoji} {list.length}
                </button>
              );
            })}
          </div>
        )}

        {!compact && (message._count?.replies ?? 0) > 0 && (
          <button
            onClick={onOpenThread}
            className="mt-1 text-xs text-blue-600 hover:underline"
          >
            {message._count!.replies}{" "}
            {message._count!.replies === 1 ? "réponse" : "réponses"}
          </button>
        )}
      </div>

      <div className="opacity-0 group-hover:opacity-100 absolute top-0 right-2 -translate-y-1/2 flex gap-1 bg-white border border-gray-200 rounded shadow-sm px-1 py-0.5">
        {QUICK_EMOJIS.slice(0, 3).map((e) => (
          <button
            key={e}
            onClick={() => onReact(message.id, e)}
            className="hover:bg-gray-100 rounded px-1 text-sm"
          >
            {e}
          </button>
        ))}
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="hover:bg-gray-100 rounded px-1 text-sm"
          title="Plus d'emojis"
        >
          😀+
        </button>
        {!compact && onOpenThread && (
          <button
            onClick={onOpenThread}
            className="hover:bg-gray-100 rounded px-1 text-xs text-gray-700"
            title="Répondre dans un fil"
          >
            💬
          </button>
        )}
      </div>

      {showPicker && (
        <div className="absolute top-6 right-2 z-10 bg-white border border-gray-200 rounded shadow p-1 flex gap-1">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => {
                onReact(message.id, e);
                setShowPicker(false);
              }}
              className="hover:bg-gray-100 rounded px-1.5 py-1"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
