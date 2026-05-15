import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-1">Profil</h1>
        <p className="text-sm text-gray-500 mb-6">
          Modifie ton avatar, ton nom et ton mot de passe.
        </p>
        <SettingsForm
          me={{
            id: me.id,
            name: me.name,
            email: me.email,
            image: me.image,
          }}
        />
      </div>
    </div>
  );
}
