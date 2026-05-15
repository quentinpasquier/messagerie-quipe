export type LinkPreviewData = {
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

const URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"',.!?;:)\]]/gi;
const FETCH_TIMEOUT_MS = 4000;
const MAX_URLS_PER_MESSAGE = 3;

export function extractUrls(content: string): string[] {
  const matches = content.match(URL_RE) ?? [];
  const unique = Array.from(new Set(matches));
  return unique.slice(0, MAX_URLS_PER_MESSAGE);
}

// Bloque les URLs internes / privées pour éviter de scrapper le LAN.
function isAllowedUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "0.0.0.0") return false;
    if (host === "127.0.0.1" || host.startsWith("169.254.")) return false;
    if (host.startsWith("10.") || host.startsWith("192.168.")) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    if (host.endsWith(".internal") || host.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

function extractMetaTags(html: string): Map<string, string> {
  const result = new Map<string, string>();
  const re = /<meta\s+([^>]+?)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[1];
    const key = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1];
    const value = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
    if (key && value) result.set(key.toLowerCase(), decodeHtmlEntities(value));
  }
  return result;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeHtmlEntities(m[1].trim()).slice(0, 300) : null;
}

function trim(value: string | undefined, max: number): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  return v.length > max ? v.slice(0, max) + "…" : v;
}

export async function fetchLinkPreview(
  rawUrl: string
): Promise<LinkPreviewData | null> {
  if (!isAllowedUrl(rawUrl)) return null;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NoxiasChat-Linkbot/1.0; +https://noxias.com)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr,en;q=0.5",
      },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      return null;
    }
    const html = (await res.text()).slice(0, 500 * 1024); // cap 500 KB
    const finalUrl = res.url || rawUrl;
    const meta = extractMetaTags(html);

    const title =
      trim(meta.get("og:title"), 300) ||
      trim(meta.get("twitter:title"), 300) ||
      trim(extractTitle(html) ?? undefined, 300);
    if (!title) return null;

    const description =
      trim(meta.get("og:description"), 400) ||
      trim(meta.get("twitter:description"), 400) ||
      trim(meta.get("description"), 400);

    let image =
      meta.get("og:image") ||
      meta.get("twitter:image") ||
      meta.get("og:image:secure_url") ||
      null;
    if (image) {
      try {
        image = new URL(image, finalUrl).toString();
      } catch {
        image = null;
      }
    }

    const siteName = trim(meta.get("og:site_name"), 100);

    return {
      url: finalUrl,
      title,
      description,
      image,
      siteName,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
