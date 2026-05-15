import React from "react";

// Regex auteur-fait: URL, email, téléphone (formats FR / internationaux courants).
const URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"',.!?;:)\]]/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_RE = /\+\d{1,3}[\s.-]?\d(?:[\s.-]?\d){7,12}|\b0\d(?:[\s.-]?\d){8}\b/;

const COMBINED_RE = new RegExp(
  [URL_RE.source, EMAIL_RE.source, PHONE_RE.source].join("|"),
  "gi"
);

type Kind = "url" | "email" | "phone";

function classify(token: string): Kind | null {
  if (/^https?:\/\//i.test(token)) return "url";
  if (EMAIL_RE.test(token)) return "email";
  const compact = token.replace(/[\s.-]/g, "");
  if (/^(\+\d|0\d)/.test(compact)) return "phone";
  return null;
}

function phoneHref(s: string): string {
  return `tel:${s.replace(/[\s.-]/g, "")}`;
}

const LINK_CLS =
  "text-noxias-greenDark underline hover:opacity-80 break-words";

export function linkify(text: string): React.ReactNode {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  // Fresh regex pour ne pas porter de lastIndex entre appels.
  const re = new RegExp(COMBINED_RE.source, "gi");
  let match: RegExpExecArray | null;
  let key = 0;

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
    } else {
      parts.push(token);
    }
    lastIndex = start + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}
