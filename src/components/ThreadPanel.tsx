"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import type { MessageDTO, ReactionDTO } from "@/types/message";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";

export function ThreadPanel({
  meId,
  channelId,
  parentId,
  onClose,
  onReply,
  onReact,
}: {
  meId: string;
  channelId: string;
  parentId: string;
  onClose: () => void;
  onReply: (content: string, imageUrl?: string | null) => Promise<void> | void;
  onReact: (messageId: string, emoji: string) => void;
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
    socket.on("message:new", onNew);
    socket.on("reactions:update", onReactions);
    return () => {
      socket.off("message:new", onNew);
      socket.off("reactions:update", onReactions);
    };
  }, [parentId, channelId]);

  return (
    <aside className="w-[380px] flex-shrink-0 border-l border-noxias-border flex flex-col bg-noxias-bg">
      <header className="border-b border-noxias-border px-4 py-3 flex items-center justify-between">
        <h2 className="font-bold text-sm text-white">Fil de discussion</h2>
        <button
          onClick={onClose}
          className="text-noxias-textMuted hover:text-white text-xl leading-none"
          aria-label="Fermer"
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        {loading ? (
          <div className="text-noxias-textMuted text-sm">Chargement...</div>
        ) : parent ? (
          <>
            <ul>
              <MessageItem
                message={parent}
                meId={meId}
                onReact={onReact}
                compact
              />
            </ul>
            <div className="my-3 border-t border-noxias-border" />
            <ul className="space-y-1">
              {replies.map((r) => (
                <MessageItem
                  key={r.id}
                  message={r}
                  meId={meId}
                  onReact={onReact}
                  compact
                />
              ))}
            </ul>
            <div ref={bottomRef} />
          </>
        ) : (
          <div className="text-noxias-textMuted text-sm">
            Message introuvable
          </div>
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
