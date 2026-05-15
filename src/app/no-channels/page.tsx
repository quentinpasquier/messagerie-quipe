export default function NoChannels() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-bold mb-2">Aucun canal disponible</h1>
        <p className="text-gray-600">
          Vous n'êtes membre d'aucun canal. Créez-en un depuis la barre latérale
          pour démarrer.
        </p>
      </div>
    </main>
  );
}
