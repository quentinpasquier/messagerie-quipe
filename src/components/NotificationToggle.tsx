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
        title="Bloquées dans ton navigateur"
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
      className="text-xs text-gray-500 hover:text-noxias-greenDark"
      title="Activer les notifs pour pas rater un deal"
    >
      🔔 Activer
    </button>
  );
}
