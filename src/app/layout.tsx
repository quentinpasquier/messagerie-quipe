import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Messagerie d'équipe",
  description: "Une messagerie d'équipe type Slack",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
