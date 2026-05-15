"use client";

import { useEffect, useState } from "react";

export function NotificationToggle() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported" | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);

  if (perm === null || perm === "unsupported" || perm === "granted") return null;

  if (perm === "denied") {
    return (
      <span
        className="text-xs text-gray-500"
        title="Notifications bloquées dans les réglages du navigateur"
      >
        🔕
      </span>
    );
  }

  async function enable() {
    try {
      const result = await Notification.requestPermission();
      setPerm(result);
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={enable}
      className="text-xs text-gray-400 hover:text-white"
      title="Activer les notifications système"
    >
      🔔 Activer
    </button>
  );
}
