# Deploy — Irekiak

Production runs on **Infomaniak Server Cloud Node.js** (managed Kubernetes runtime).

- URL : https://irekiak.sakana-art.com
- Runtime : Node.js 24 LTS
- Working dir (serveur) : `/srv/customer/irekiak/`
- Source : ce repo, cloné côté serveur

## Workflow

1. Commit local → `git push origin main`
2. Manager Infomaniak → Sites web → `irekiak.sakana-art.com` → Manage → onglet Node.js
3. Cliquer **Build** → Infomaniak exécute la Build Command → redémarre le runtime
4. Vérifier `curl -sI https://irekiak.sakana-art.com/`

## Configuration Builder Infomaniak

| Champ | Valeur |
|-------|--------|
| Execution Folder | `./` |
| Node.js version | 24 LTS |
| Build Command | `git pull && corepack enable && pnpm install --frozen-lockfile && pnpm build` |
| Start Command | `node .output/server/index.mjs` |

## Variables d'environnement (UI Infomaniak)

Définies dans le manager → Environment Variables — **pas dans `.env` serveur**.

| Variable | Source |
|----------|--------|
| `NODE_ENV` | `production` |
| `NUXT_PUBLIC_SITE_URL` | `https://irekiak.sakana-art.com` |
| `NUXT_RESEND_API_KEY` | Resend dashboard |
| `NUXT_CONTACT_EMAIL` | `irekiak@irekiak.eus` |
| `NUXT_ADMIN_TOKEN_SECRET` | `openssl rand -hex 32` |

Nuxt injecte `PORT` automatiquement (Nitro respecte `process.env.PORT`).

`DATABASE_PATH` non nécessaire — défaut relatif `.data/irekiak.db` dans le working dir.

## Setup initial (une fois)

Console SSH Infomaniak (web) :

```bash
# Clone avec deploy key
ssh-keygen -t ed25519 -C "infomaniak-deploy" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub  # ajouter comme Deploy Key sur GitHub
git clone git@github.com:jaimepaslart/irekiak.git ~/irekiak
```

Puis configurer le Builder (tableau ci-dessus) + cliquer **Build**.

## Persistance

- `.data/irekiak.db` — créée au premier démarrage (auto-init + auto-seed depuis `data/tours.ts`)
- Préservée entre rebuilds (pas dans le `.gitignore` serveur, reste dans le working dir)

## Backup BDD

Cron nightly (à configurer) :

```bash
sqlite3 .data/irekiak.db ".backup .data/backup-$(date +%F).db"
# + upload vers stockage externe (kDrive, S3, etc.)
```

## Rollback

```bash
cd ~/irekiak
git log --oneline -10
git checkout <commit-hash>
# puis Build dans le manager
```
