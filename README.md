# Messagerie d'équipe

Une messagerie d'équipe type Slack : canaux publics, messages directs, fils de
discussion, réactions emoji, indicateur de frappe et messages en temps réel.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** + **SQLite** pour la persistance
- **Socket.io** pour le temps réel (serveur custom `server.ts`)
- **TailwindCSS** pour l'UI
- **JWT** (via `jose`) + cookie HTTP-only pour les sessions
- **bcryptjs** pour le hash des mots de passe

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Préparer la base SQLite
cp .env.example .env   # adapter AUTH_SECRET en prod
npx prisma db push

# 3. Lancer le serveur de dev (Next + Socket.io)
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) — crée un compte, puis
ouvre un second onglet en navigation privée (ou un second navigateur) pour
créer un autre compte et tester la messagerie en temps réel entre les deux.

## Fonctionnalités

- Authentification email/mot de passe (sessions JWT)
- Canaux publics partagés par toute l'équipe
- Création de canaux à la volée
- Messages directs entre deux utilisateurs
- Fils de discussion (réponses sous un message dans un panneau latéral)
- Réactions emoji (toggle par utilisateur)
- Indicateur « X est en train d'écrire »
- Diffusion temps réel via Socket.io (nouveaux messages, réactions, frappe)

## Architecture

```
server.ts                       # serveur HTTP custom (Next + Socket.io)
middleware.ts                   # garde les routes protégées
prisma/schema.prisma            # User, Channel, ChannelMember, Message, Reaction
src/
  app/
    (app)/                      # zone authentifiée : layout sidebar + main
      c/[id]/page.tsx           # vue d'un canal (ou DM, c'est un canal type DM)
    api/                        # routes REST (auth, channels, messages, réactions, dm)
    login/, signup/             # pages publiques
  components/                   # Sidebar, ChannelView, MessageItem, ThreadPanel...
  lib/
    auth.ts                     # createSession/readSession (JWT cookie)
    prisma.ts                   # singleton Prisma
    realtime.ts                 # emitToChannel côté serveur
    socket-client.ts            # singleton socket.io-client
```

Les DM réutilisent le modèle `Channel` avec `type = "DM"` et 2 membres — ça
évite de dupliquer toute la logique de messagerie.

## Production

- Mettre un `AUTH_SECRET` robuste (≥ 32 caractères aléatoires)
- Migrer vers PostgreSQL en remplaçant `provider = "sqlite"` dans
  `prisma/schema.prisma` et `DATABASE_URL` dans `.env`
- `npm run build && npm start`

## Limitations connues du MVP

- Pas d'upload de fichiers / images
- Pas de notifications hors-onglet
- Tous les utilisateurs partagent une équipe unique (pas de workspaces multiples)
- Pas de pagination de l'historique (limite à 200 derniers messages par canal)
- Pas de présence en ligne / statut utilisateur
