import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 15% 10%, rgba(60,200,121,0.10) 0%, transparent 45%), radial-gradient(circle at 85% 90%, rgba(34,25,50,0.08) 0%, transparent 50%)",
        }}
      />
      <div className="relative w-full max-w-md rounded-xl bg-white border border-gray-200 p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-noxias-green text-xl font-black tracking-tight">
            Noxias
          </span>
          <span className="text-gray-500 text-sm">Chat</span>
        </div>
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Re-bonjour</h1>
        <p className="text-sm text-gray-500 mb-6">
          Pas encore dans le pipe ?{" "}
          <Link href="/signup" className="text-noxias-green hover:underline">
            Crée ton compte
          </Link>
        </p>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
