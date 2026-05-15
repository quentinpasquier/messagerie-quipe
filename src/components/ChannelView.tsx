"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import type { LinkPreviewDTO, MessageDTO, ReactionDTO } from "@/types/message";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";
import { ThreadPanel } from "./ThreadPanel";

type Props = {
  me: { id: string; name: string };
  channel: {
    id: string;
    name: string;
    description: string | null;
    isDM: boolean;
  };
};

export function ChannelView({ me, channel }: Props) {
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setThreadParentId(null);
    fetch(`/api/channels/${channel.id}/messages`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setMessages(data.messages ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [channel.id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Socket subscription
  useEffect(() => {
    const socket = getSocket();
    socket.emit("viewing:join", channel.id);

    const onMessage = (m: MessageDTO) => {
      if (m.channelId !== channel.id) return;
      if (m.parentId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === m.parentId
              ? {
                  ...msg,
                  _count: { replies: (msg._count?.replies ?? 0) + 1 },
                }
              : msg
          )
        );
        return;
      }
      setMessages((prev) => {
        if (prev.some((p) => p.id === m.id)) return prev;
        return [...prev, m];
      });
    };

    const onReactions = (payload: {
      messageId: string;
      reactions: ReactionDTO[];
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, reactions: payload.reactions }
            : m
        )
      );
    };

    const onTyping = (payload: { userId: string; name: string }) => {
      if (payload.userId === me.id) return;
      setTypingUsers((prev) => ({ ...prev, [payload.name]: Date.now() }));
    };

    const onPreviews = (payload: {
      messageId: string;
      linkPreviews: LinkPreviewDTO[];
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, linkPreviews: payload.linkPreviews }
            : m
        )
      );
    };

    const onDeleted = (payload: {
      messageId: string;
      channelId: string;
      parentId: string | null;
    }) => {
      if (payload.channelId !== channel.id) return;
      if (payload.parentId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === payload.parentId
              ? {
                  ...msg,
                  _count: {
                    replies: Math.max(0, (msg._count?.replies ?? 1) - 1),
                  },
                }
              : msg
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
        setThreadParentId((curr) =>
          curr === payload.messageId ? null : curr
        );
      }
    };

    socket.on("message:new", onMessage);
    socket.on("reactions:update", onReactions);
    socket.on("typing", onTyping);
    socket.on("message:deleted", onDeleted);
    socket.on("message:previews", onPreviews);

    return () => {
      socket.emit("viewing:leave", channel.id);
      socket.off("message:new", onMessage);
      socket.off("reactions:update", onReactions);
      socket.off("typing", onTyping);
      socket.off("message:deleted", onDeleted);
      socket.off("message:previews", onPreviews);
    };
  }, [channel.id, me.id]);

  // Expire typing indicators after 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const next: Record<string, number> = {};
        let changed = false;
        for (const [k, ts] of Object.entries(prev)) {
          if (now - ts < 3000) next[k] = ts;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      imageUrl?: string | null,
      parentId?: string | null
    ) => {
      await fetch(`/api/channels/${channel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          imageUrl: imageUrl ?? null,
          parentId: parentId ?? null,
        }),
      });
    },
    [channel.id]
  );

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    await fetch(`/api/messages/${messageId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Impossible de supprimer");
    }
  }, []);

  const emitTyping = useCallback(() => {
    const socket = getSocket();
    socket.emit("typing", {
      channelId: channel.id,
      userId: me.id,
      name: me.name,
    });
  }, [channel.id, me.id, me.name]);

  const typingNames = Object.keys(typingUsers);

  const placeholder = channel.isDM
    ? `Glisser un mot à ${channel.name}...`
    : `Pitcher dans #${channel.name}...`;

  return (
    <div className="flex h-full min-w-0 bg-white text-gray-900">
      <section className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-gray-200 px-5 py-3 flex items-center gap-2 bg-white">
          <span className="text-gray-500">{channel.isDM ? "@" : "#"}</span>
          <h1 className="font-bold text-lg truncate text-gray-900">
            {channel.name}
          </h1>
          {channel.description && (
            <span className="text-sm text-gray-500 ml-3 truncate">
              {channel.description}
            </span>
          )}
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4"
        >
          {loading ? (
            <div className="text-gray-500 text-sm">
              Chargement... (le CRM s'échauffe)
            </div>
          ) : messages.length === 0 ? (
            <div className="text-gray-500 text-sm italic">
              Silence radio. À toi l'ouverture. 🎤
            </div>
          ) : (
            <ul className="space-y-1">
              {messages.map((m) => (
                <MessageItem
                  key={m.id}
                  message={m}
                  meId={me.id}
                  onReact={toggleReaction}
                  onOpenThread={() => setThreadParentId(m.id)}
                  onDelete={deleteMessage}
                />
              ))}
            </ul>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-5 py-2 text-xs text-gray-500 h-6">
          {typingNames.length > 0 && (
            <span>
              {typingNames.slice(0, 3).join(", ")}{" "}
              {typingNames.length === 1 ? "est au phone" : "sont au phone"}...
            </span>
          )}
        </div>

        <div className="px-5 pb-4">
          <MessageInput
            onSend={(content, imageUrl) => sendMessage(content, imageUrl, null)}
            onTyping={emitTyping}
            placeholder={placeholder}
          />
        </div>
      </section>

      {threadParentId && (
        <ThreadPanel
          meId={me.id}
          channelId={channel.id}
          parentId={threadParentId}
          onClose={() => setThreadParentId(null)}
          onReply={(content, imageUrl) =>
            sendMessage(content, imageUrl, threadParentId)
          }
          onReact={toggleReaction}
          onDelete={deleteMessage}
        />
      )}
    </div>
  );
}
