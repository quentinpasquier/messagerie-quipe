import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar to-purple-900 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-1">Connexion</h1>
        <p className="text-sm text-gray-500 mb-6">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Créer un compte
          </Link>
        </p>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
