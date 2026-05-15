// Mini-confettis maison : pas de dépendance, ~30 émojis qui tombent.

const SALES_EMOJIS = ["🎉", "💰", "🚀", "💸", "🏆", "✨", "🥂", "📈", "🎯"];

const KEYWORDS = [
  "closing",
  "closé",
  "closed",
  "close ",
  "signé",
  "signature",
  "signe ",
  "deal won",
  "deal closed",
  "deal!",
  "deal :",
  "won",
  "gagné",
  "gagner",
  "vente",
  "vendu",
  "contrat",
  "go!",
  "let's go",
  "lfg",
  "🎉",
  "🏆",
  "💰",
  "🎯",
  "boom",
];

export function shouldFireConfetti(content: string): boolean {
  if (!content) return false;
  const lower = content.toLowerCase();
  return KEYWORDS.some((k) => lower.includes(k));
}

let lastFire = 0;

export function fireConfetti() {
  if (typeof window === "undefined") return;
  // Throttle pour éviter le matraquage si plusieurs messages arrivent.
  const now = Date.now();
  if (now - lastFire < 1500) return;
  lastFire = now;

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(container);

  const count = 35;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const emoji =
      SALES_EMOJIS[Math.floor(Math.random() * SALES_EMOJIS.length)];
    el.textContent = emoji;
    const size = 18 + Math.random() * 26;
    const startLeft = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 300;
    const rotate = Math.random() * 720;
    const delay = Math.random() * 300;
    const duration = 1800 + Math.random() * 1400;
    el.style.cssText = `
      position:absolute;
      top:-60px;
      left:${startLeft}%;
      font-size:${size}px;
      transform:translate(0,0) rotate(0deg);
      opacity:1;
      transition:transform ${duration}ms cubic-bezier(.2,.6,.4,1) ${delay}ms,
                 opacity ${duration}ms ease-out ${delay}ms;
      will-change:transform,opacity;
    `;
    container.appendChild(el);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform = `translate(${drift}px, ${window.innerHeight + 80}px) rotate(${rotate}deg)`;
        el.style.opacity = "0";
      });
    });
  }
  setTimeout(() => container.remove(), 3800);
}
