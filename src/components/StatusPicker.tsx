"use client";

import { useEffect, useRef, useState } from "react";
import { STATUS_COLOR, STATUS_LABEL } from "./Avatar";
import { useStatus } from "./StatusProvider";

const OPTIONS = ["ONLINE", "BUSY", "AWAY"] as const;

export function StatusPicker({ meId }: { meId: string }) {
  const current = useStatus(meId);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function setStatus(status: string) {
    setBusy(true);
    try {
      await fetch("/api/me/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-gray-300 hover:text-white"
        disabled={busy}
      >
        <span
          className={`w-2 h-2 rounded-full ${STATUS_COLOR[current] || STATUS_COLOR.OFFLINE}`}
        />
        <span>{STATUS_LABEL[current] || current}</span>
        <span className="text-gray-500">▾</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-white text-gray-800 rounded shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setStatus(opt)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <span
                className={`w-2 h-2 rounded-full ${STATUS_COLOR[opt]}`}
              />
              {STATUS_LABEL[opt]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
