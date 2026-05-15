import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-noxias-bg p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, #221932 0%, transparent 55%), radial-gradient(circle at 70% 85%, #3cc879 0%, transparent 55%)",
        }}
      />
      <div className="relative w-full max-w-md rounded-xl bg-noxias-surface border border-noxias-border p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-noxias-green text-xl font-black tracking-tight">
            Noxias
          </span>
          <span className="text-noxias-textMuted text-sm">Chat</span>
        </div>
        <h1 className="text-2xl font-bold mb-1 text-white">Onboarding</h1>
        <p className="text-sm text-noxias-textMuted mb-6">
          Déjà en closing ?{" "}
          <Link href="/login" className="text-noxias-green hover:underline">
            Connecte-toi
          </Link>
        </p>
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
