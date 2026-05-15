"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import type { LinkPreviewDTO, MessageDTO, ReactionDTO } from "@/types/message";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";

export function ThreadPanel({
  meId,
  channelId,
  parentId,
  onClose,
  onReply,
  onReact,
  onDelete,
}: {
  meId: string;
  channelId: string;
  parentId: string;
  onClose: () => void;
  onReply: (content: string, imageUrl?: string | null) => Promise<void> | void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
}) {
  const [parent, setParent] = useState<MessageDTO | null>(null);
  const [replies, setReplies] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/messages/${parentId}/thread`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setParent(data.parent);
        setReplies(data.replies ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [parentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  useEffect(() => {
    const socket = getSocket();
    const onNew = (m: MessageDTO) => {
      if (m.parentId !== parentId) return;
      setReplies((prev) =>
        prev.some((p) => p.id === m.id) ? prev : [...prev, m]
      );
    };
    const onReactions = (payload: {
      messageId: string;
      reactions: ReactionDTO[];
    }) => {
      setParent((p) =>
        p && p.id === payload.messageId
          ? { ...p, reactions: payload.reactions }
          : p
      );
      setReplies((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, reactions: payload.reactions }
            : m
        )
      );
    };
    const onPreviews = (payload: {
      messageId: string;
      linkPreviews: LinkPreviewDTO[];
    }) => {
      setParent((p) =>
        p && p.id === payload.messageId
          ? { ...p, linkPreviews: payload.linkPreviews }
          : p
      );
      setReplies((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, linkPreviews: payload.linkPreviews }
            : m
        )
      );
    };

    const onDeleted = (payload: {
      messageId: string;
      parentId: string | null;
    }) => {
      if (payload.messageId === parentId) {
        onClose();
        return;
      }
      if (payload.parentId === parentId) {
        setReplies((prev) => prev.filter((r) => r.id !== payload.messageId));
      }
    };

    socket.on("message:new", onNew);
    socket.on("reactions:update", onReactions);
    socket.on("message:deleted", onDeleted);
    socket.on("message:previews", onPreviews);
    return () => {
      socket.off("message:new", onNew);
      socket.off("reactions:update", onReactions);
      socket.off("message:deleted", onDeleted);
      socket.off("message:previews", onPreviews);
    };
  }, [parentId, channelId, onClose]);

  return (
    <aside className="w-[380px] flex-shrink-0 border-l border-gray-200 flex flex-col bg-white">
      <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="font-bold text-sm text-gray-900">Fil de discussion</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-900 text-xl leading-none"
          aria-label="Fermer"
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        {loading ? (
          <div className="text-gray-500 text-sm">Chargement...</div>
        ) : parent ? (
          <>
            <ul>
              <MessageItem
                message={parent}
                meId={meId}
                onReact={onReact}
                onDelete={onDelete}
                compact
              />
            </ul>
            <div className="my-3 border-t border-gray-200" />
            <ul className="space-y-1">
              {replies.map((r) => (
                <MessageItem
                  key={r.id}
                  message={r}
                  meId={meId}
                  onReact={onReact}
                  onDelete={onDelete}
                  compact
                />
              ))}
            </ul>
            <div ref={bottomRef} />
          </>
        ) : (
          <div className="text-gray-500 text-sm">Message introuvable</div>
        )}
      </div>

      <div className="px-3 pb-3">
        <MessageInput
          onSend={(content, imageUrl) => onReply(content, imageUrl)}
          placeholder="Rebondir dans le fil..."
        />
      </div>
    </aside>
  );
}
