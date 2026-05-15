import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar to-purple-900 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-1">Créer un compte</h1>
        <p className="text-sm text-gray-500 mb-6">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
