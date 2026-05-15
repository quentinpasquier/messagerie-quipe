"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Réseau dans les choux. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="block text-sm font-medium mb-1 text-noxias-text">
            Nom
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Prénom Nom"
            className="w-full rounded border border-noxias-border bg-noxias-bg px-3 py-2 text-white placeholder-noxias-textMuted focus:outline-none focus:border-noxias-green"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1 text-noxias-text">
          Email pro
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="prenom@noxias.com"
          className="w-full rounded border border-noxias-border bg-noxias-bg px-3 py-2 text-white placeholder-noxias-textMuted focus:outline-none focus:border-noxias-green"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-noxias-text">
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Pas 'azerty123'"
          className="w-full rounded border border-noxias-border bg-noxias-bg px-3 py-2 text-white placeholder-noxias-textMuted focus:outline-none focus:border-noxias-green"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-noxias-green py-2 font-semibold text-noxias-bg hover:bg-noxias-greenDark disabled:opacity-50 transition-colors"
      >
        {loading
          ? "..."
          : mode === "login"
          ? "Au taquet"
          : "Rejoindre l'équipe"}
      </button>
    </form>
  );
}
