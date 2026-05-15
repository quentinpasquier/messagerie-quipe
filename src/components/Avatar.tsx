"use client";

import { useStatus } from "./StatusProvider";

const COLORS = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-yellow-500 to-orange-500",
  "from-indigo-500 to-purple-500",
];

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return COLORS[Math.abs(h) % COLORS.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SIZES = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-20 h-20 text-2xl",
};

const DOT_SIZES = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-5 h-5",
};

export const STATUS_COLOR: Record<string, string> = {
  ONLINE: "bg-emerald-500",
  BUSY: "bg-red-500",
  AWAY: "bg-yellow-500",
  OFFLINE: "bg-gray-400",
};

export const STATUS_LABEL: Record<string, string> = {
  ONLINE: "En ligne",
  BUSY: "Occupé",
  AWAY: "Absent",
  OFFLINE: "Hors ligne",
};

export function Avatar({
  user,
  size = "md",
  showStatus = true,
  ringClass = "ring-white",
}: {
  user: { id: string; name: string; image: string | null };
  size?: keyof typeof SIZES;
  showStatus?: boolean;
  ringClass?: string;
}) {
  const status = useStatus(user.id);
  return (
    <div className={`relative ${SIZES[size]} flex-shrink-0`}>
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt={user.name}
          className={`${SIZES[size]} rounded object-cover`}
        />
      ) : (
        <div
          className={`${SIZES[size]} rounded bg-gradient-to-br ${hashColor(
            user.name
          )} text-white grid place-items-center font-bold`}
        >
          {initials(user.name)}
        </div>
      )}
      {showStatus && (
        <span
          title={STATUS_LABEL[status] || status}
          className={`absolute -bottom-0.5 -right-0.5 ${DOT_SIZES[size]} rounded-full ring-2 ${ringClass} ${STATUS_COLOR[status]}`}
        />
      )}
    </div>
  );
}
