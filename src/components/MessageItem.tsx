"use client";

import { useState } from "react";
import type { MessageDTO } from "@/types/message";
import { Avatar } from "./Avatar";
import { linkify } from "@/lib/linkify";

const QUICK_EMOJIS = ["👍", "❤️", "😄", "🎉", "👀", "🚀"];

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
  onDelete,
  compact = false,
}: {
  message: MessageDTO;
  meId: string;
  onReact: (messageId: string, emoji: string) => void;
  onOpenThread?: () => void;
  onDelete?: (messageId: string) => void;
  compact?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const isMine = message.userId === meId;

  const grouped = message.reactions.reduce<
    Record<string, typeof message.reactions>
  >((acc, r) => {
    (acc[r.emoji] ||= []).push(r);
    return acc;
  }, {});

  function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Effacer définitivement ce message ?")) return;
    onDelete(message.id);
  }

  return (
    <li className="group relative flex gap-3 px-2 py-1.5 rounded hover:bg-gray-50">
      <Avatar
        user={{
          id: message.user.id,
          name: message.user.name,
          image: message.user.image,
        }}
        size="md"
        ringClass="ring-white"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-sm text-gray-900">
            {message.user.name}
          </span>
          <span className="text-xs text-gray-500">
            {timeFmt(message.createdAt)}
          </span>
        </div>
        {message.content && (
          <div className="text-sm whitespace-pre-wrap break-words text-gray-800">
            {linkify(message.content)}
          </div>
        )}
        {message.imageUrl && (
          <a
            href={message.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.imageUrl}
              alt=""
              loading="lazy"
              className="max-w-sm max-h-96 rounded border border-gray-200 object-cover"
            />
          </a>
        )}

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
                      ? "bg-noxias-green/10 border-noxias-green text-noxias-greenDark"
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
            className="mt-1 text-xs text-noxias-greenDark hover:underline"
          >
            {message._count!.replies}{" "}
            {message._count!.replies === 1 ? "réponse" : "réponses"} — ouvrir le
            fil
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
        {isMine && onDelete && (
          <button
            onClick={handleDelete}
            className="hover:bg-red-50 hover:text-red-600 rounded px-1 text-xs text-gray-600"
            title="Supprimer"
          >
            🗑️
          </button>
        )}
      </div>

      {showPicker && (
        <div className="absolute top-6 right-2 z-10 bg-white border border-gray-200 rounded shadow-lg p-1 flex gap-1">
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
