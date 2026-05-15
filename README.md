# Messagerie d'équipe

Une messagerie d'équipe type Slack : canaux publics, messages directs, fils de
discussion, réactions emoji, indicateur de frappe et messages en temps réel.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** + **PostgreSQL** pour la persistance
- **Socket.io** pour le temps réel (serveur custom `server.ts`)
- **TailwindCSS** pour l'UI
- **JWT** (via `jose`) + cookie HTTP-only pour les sessions
- **bcryptjs** pour le hash des mots de passe

## Démarrage en local

Il te faut un Postgres accessible. Le plus rapide via Docker :

```bash
docker run --name mq-pg -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
```

(ou installe Postgres avec `brew install postgresql@16 && brew services start postgresql@16`)

Ensuite :

```bash
npm install
cp .env.example .env        # ajuste DATABASE_URL et AUTH_SECRET
npx prisma db push          # crée le schéma
npm run dev                 # lance Next + Socket.io
```

Ouvre [http://localhost:3000](http://localhost:3000) et crée un compte. Pour
tester le temps réel, ouvre un second onglet en navigation privée et inscris
un autre utilisateur.

## Déploiement sur Railway

1. Crée un projet Railway et connecte ce repo
2. Ajoute un service **PostgreSQL** dans le projet
3. Définis les variables d'env du service Next :
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (référence Railway)
   - `AUTH_SECRET` = une string aléatoire (`openssl rand -base64 32`)
4. Génère un domaine public (Settings → Networking → Generate Domain)

Le `start` script applique le schéma à chaque démarrage via `prisma db push`,
donc pas de migration manuelle à lancer.

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

## Limitations connues du MVP

- Pas d'upload de fichiers / images
- Pas de notifications hors-onglet
- Tous les utilisateurs partagent une équipe unique (pas de workspaces multiples)
- Pas de pagination de l'historique (limite à 200 derniers messages par canal)
- Pas de présence en ligne / statut utilisateur
