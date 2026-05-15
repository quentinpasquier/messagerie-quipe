"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSocket } from "@/lib/socket-client";

type StatusMap = Record<string, string>;

const StatusContext = createContext<StatusMap>({});

export function StatusProvider({
  initial,
  children,
}: {
  initial: StatusMap;
  children: React.ReactNode;
}) {
  const [statuses, setStatuses] = useState<StatusMap>(initial);

  useEffect(() => {
    const socket = getSocket();
    const onStatus = ({
      userId,
      status,
    }: {
      userId: string;
      status: string;
    }) => {
      setStatuses((prev) =>
        prev[userId] === status ? prev : { ...prev, [userId]: status }
      );
    };
    socket.on("user:status", onStatus);
    return () => {
      socket.off("user:status", onStatus);
    };
  }, []);

  const value = useMemo(() => statuses, [statuses]);
  return (
    <StatusContext.Provider value={value}>{children}</StatusContext.Provider>
  );
}

export function useStatus(userId: string | null | undefined): string {
  const map = useContext(StatusContext);
  if (!userId) return "OFFLINE";
  return map[userId] || "OFFLINE";
}
