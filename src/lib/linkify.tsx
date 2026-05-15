import React from "react";

// Regex auteur-fait: URL, email, téléphone (formats FR / internationaux courants).
const URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"',.!?;:)\]]/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_RE = /\+\d{1,3}[\s.-]?\d(?:[\s.-]?\d){7,12}|\b0\d(?:[\s.-]?\d){8}\b/;
// Mentions @{name} — un nom commercial peut contenir espaces, on essaie 1 à 3 mots.
const MENTION_RE = /@[\p{L}][\p{L}\p{M}'-]*(?: [\p{L}][\p{L}\p{M}'-]*){0,3}/u;

const COMBINED_RE = new RegExp(
  [URL_RE.source, EMAIL_RE.source, PHONE_RE.source, MENTION_RE.source].join(
    "|"
  ),
  "giu"
);

type Kind = "url" | "email" | "phone" | "mention";

function classify(token: string): Kind | null {
  if (/^https?:\/\//i.test(token)) return "url";
  if (token.startsWith("@")) return "mention";
  if (EMAIL_RE.test(token)) return "email";
  const compact = token.replace(/[\s.-]/g, "");
  if (/^(\+\d|0\d)/.test(compact)) return "phone";
  return null;
}

// On accepte une mention seulement si le nom matche un user. Sinon
// on tronque (greedy → on essaie 4 mots, puis 3, puis 2, puis 1).
function resolveMention(
  raw: string,
  names: Set<string>
): { match: string | null; rest: string } {
  const candidate = raw.slice(1); // sans @
  const words = candidate.split(" ");
  for (let n = words.length; n >= 1; n--) {
    const tryName = words.slice(0, n).join(" ");
    if (names.has(tryName.toLowerCase())) {
      return {
        match: "@" + tryName,
        rest: words.slice(n).join(" "),
      };
    }
  }
  return { match: null, rest: candidate };
}

function phoneHref(s: string): string {
  return `tel:${s.replace(/[\s.-]/g, "")}`;
}

const LINK_CLS =
  "text-noxias-greenDark underline hover:opacity-80 break-words";

const MENTION_CLS =
  "bg-noxias-green/15 text-noxias-greenDark font-semibold rounded px-1 py-0.5";
const MENTION_ME_CLS =
  "bg-noxias-green text-noxias-bg font-semibold rounded px-1 py-0.5";

export function linkify(
  text: string,
  opts?: { userNames?: Set<string>; meName?: string }
): React.ReactNode {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(COMBINED_RE.source, "giu");
  let match: RegExpExecArray | null;
  let key = 0;
  const userNames = opts?.userNames ?? new Set<string>();
  const meName = opts?.meName?.toLowerCase();

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const token = match[0];
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));

    const kind = classify(token);
    if (kind === "url") {
      parts.push(
        <a
          key={key++}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLS}
        >
          {token}
        </a>
      );
    } else if (kind === "email") {
      parts.push(
        <a key={key++} href={`mailto:${token}`} className={LINK_CLS}>
          {token}
        </a>
      );
    } else if (kind === "phone") {
      parts.push(
        <a
          key={key++}
          href={phoneHref(token)}
          className={`${LINK_CLS} inline-flex items-center gap-0.5`}
          title="Appeler"
        >
          📞 {token}
        </a>
      );
    } else if (kind === "mention") {
      const { match: resolved, rest } = resolveMention(token, userNames);
      if (resolved) {
        const isMe =
          meName && resolved.slice(1).toLowerCase() === meName;
        parts.push(
          <span key={key++} className={isMe ? MENTION_ME_CLS : MENTION_CLS}>
            {resolved}
          </span>
        );
        // re-positionner lastIndex après la mention résolue.
        lastIndex = start + resolved.length;
        if (rest) parts.push(" " + rest);
        // Le regex a consommé tout le token; saute manuellement.
        re.lastIndex = start + token.length;
        if (rest) lastIndex = start + token.length;
        continue;
      } else {
        parts.push(token);
      }
    } else {
      parts.push(token);
    }
    lastIndex = start + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}
