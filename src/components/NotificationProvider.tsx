"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket-client";
import type { MessageDTO } from "@/types/message";

type Ctx = {
  counts: Record<string, number>;
  markRead: (channelId: string) => void;
};

const NotificationContext = createContext<Ctx>({
  counts: {},
  markRead: () => {},
});

const BASE_TITLE = "Messagerie d'équipe";

function canShowOSNotification(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  );
}

export function NotificationProvider({
  meId,
  children,
}: {
  meId: string;
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const currentChannelId = (params?.id as string | undefined) ?? "";
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const socket = getSocket();
    const onMessage = (m: MessageDTO) => {
      if (m.parentId) return;
      if (m.userId === meId) return;

      const isCurrent = m.channelId === currentChannelId;
      if (!isCurrent) {
        setCounts((prev) => ({
          ...prev,
          [m.channelId]: (prev[m.channelId] || 0) + 1,
        }));
      }

      // OS notification only when tab is hidden / unfocused.
      if (!isCurrent && document.hidden && canShowOSNotification()) {
        const body =
          m.content || (m.imageUrl ? "📷 a partagé une image" : "");
        try {
          const notif = new Notification(m.user.name, {
            body: body.length > 200 ? body.slice(0, 200) + "…" : body,
            icon: m.user.image || undefined,
            tag: `mq-${m.channelId}`,
          });
          notif.onclick = () => {
            window.focus();
            notif.close();
            router.push(`/c/${m.channelId}`);
          };
        } catch {
          // certain platforms throw if not user-activated; ignore
        }
      }
    };
    socket.on("message:new", onMessage);
    return () => {
      socket.off("message:new", onMessage);
    };
  }, [meId, currentChannelId, router]);

  useEffect(() => {
    if (!currentChannelId) return;
    setCounts((prev) => {
      if (!prev[currentChannelId]) return prev;
      const next = { ...prev };
      delete next[currentChannelId];
      return next;
    });
  }, [currentChannelId]);

  useEffect(() => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    document.title = total > 0 ? `(${total}) ${BASE_TITLE}` : BASE_TITLE;
  }, [counts]);

  const markRead = useCallback((channelId: string) => {
    setCounts((prev) => {
      if (!prev[channelId]) return prev;
      const next = { ...prev };
      delete next[channelId];
      return next;
    });
  }, []);

  const value = useMemo(() => ({ counts, markRead }), [counts, markRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useUnreadCounts(): Record<string, number> {
  return useContext(NotificationContext).counts;
}

export function useUnread(channelId: string): number {
  return useContext(NotificationContext).counts[channelId] || 0;
}

export function useMarkRead() {
  return useContext(NotificationContext).markRead;
}
