# AMBO Tech - Deployer CLI

> **CLI interactif universel de provisioning de VPS et de deploiement Docker multi-fournisseurs (Google Workspace, OVH, Cloudflare R2, AWS S3, Dexchange SMS).**

---

## Sommaire
1. [Fonctionnalites Principales](#fonctionnalites-principales)
2. [Installation en 1 Seule Ligne (VPS Vierge)](#installation-en-1-seule-ligne-vps-vierge)
3. [Fournisseurs & Integrations Pris en Charge](#fournisseurs--integrations-pris-en-charge)
4. [Commandes Disponibles](#commandes-disponibles)
5. [Architecture & Fonctionnement Technique](#architecture--fonctionnement-technique)
6. [Deploiement Rejouable via Profil JSON](#deploiement-rejouable-via-profil-json)
7. [Licence](#licence)

---

## Fonctionnalites Principales

* **Assistant Interactif Terminal (TUI) :** Navigation guidee avec `@clack/prompts`, masquage automatique des mots de passe et validation en temps reel.
* **Securisation et Durcissement Automatique de l'OS :**
  * Creation et activation d'un espace **Swap de 2 Go** (evite les plantages OOM lors des builds Docker).
  * Configuration stricte du pare-feu **UFW** (Ports 22 SSH, 80 HTTP, 443 HTTPS).
* **Moteur Docker & Compose Officiel :**
  * Installation des depots APT officiels Docker et du plugin Compose.
  * Gestion des droits utilisateurs sans `sudo`.
* **Generation Cryptographique des Secrets :**
  * Mots de passe PostgreSQL et cles `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` generes a haute entropie (384/512 bits).
  * Fichier `.env` cree avec verrouillage strict des droits (`chmod 600`).
* **Nginx Reverse Proxy & SSL Let's Encrypt :**
  * VirtualHost Nginx optimise pour NestJS, WebSockets, IP reelles et gros fichiers (25 Mo).
  * Certificat SSL HTTPS delivre et renouvele automatiquement par Certbot.
* **Sauvegardes Quotidiennes Automatisees :**
  * Dump logique PostgreSQL compresse en `.sql.gz` chaque nuit a 02h00 avec rotation automatique.
* **Runner GitHub Actions Self-Hosted :**
  * Connexion d'un agent de build/deploiement continu sans aucun frais de minutes GitHub.

---

## Installation en 1 Seule Ligne (VPS Vierge)

Sur un serveur Ubuntu (22.04 / 24.04 LTS) ou Debian neuf, executez simplement :

```bash
curl -fsSL https://raw.githubusercontent.com/nosleepman1/deployer/main/scripts/install.sh | bash
```

Le script installe Node.js, clone le CLI, compile le TypeScript et demarre immediatement l'assistant de configuration.

---

## Fournisseurs & Integrations Pris en Charge

### Fournisseurs d'Emails (SMTP)
* **Google Workspace / Gmail :** Detection automatique, port 587, instructions integrees pour le mot de passe d'application 16 caracteres.
* **OVH Mail / Pro :** Configuration `ssl0.ovh.net`, port 587.
* **Brevo (ex-Sendinblue) :** Configuration `smtp-relay.brevo.com`.
* **Resend :** API & SMTP `smtp.resend.com:465`.
* **Serveur SMTP Personnalise :** Saisie personnalisee d'hote, port et identifiants.

### Stockage d'Objets & Medias (S3-Compatible)
* **Cloudflare R2 :** Zero frais d'egress / bande passante, nom de domaine personnalise (`media.domaine.sn`).
* **Amazon Web Services (AWS S3) :** Support multi-regions (eu-west-3, etc.).
* **Volume Local Docker :** Stockage direct sur le disque du serveur sans tiers.

### Passerelles SMS
* **Dexchange SMS :** Passerelle de reference au Senegal (Orange, Wave, Free Senegal) avec Sender ID personnalise.
* **Twilio :** Passerelle mondiale via Account SID et Auth Token.
* **Desactive :** Mode developpement avec logs dans la console.

---

## Commandes Disponibles

Apres installation, le binaire `deployer` est accessible globalement dans tout le systeme :

```bash
# 1. Lancer l'assistant de configuration et de deploiement complet
deployer init

# 2. Lancer un deploiement silencieux a partir d'un fichier de profil JSON
deployer init --config /chemin/vers/deployer.config.json

# 3. Diagnostiquer la sante du serveur (RAM, Swap, Docker, Nginx, Ports)
deployer doctor

# 4. Declencher une sauvegarde immediate de la base de donnees
deployer backup

# 5. Restaurer une sauvegarde existante
deployer restore /var/backups/afd-textile/dump_afd_textile_prod_2026-09-13.sql.gz

# 6. Mettre a jour automatiquement le CLI vers la derniere version
deployer update

# 7. Connecter ou reenregistrer un Runner GitHub Actions Self-Hosted
deployer runner
```

---

## Gestion des Releases et Mises a Jour (Zero Frais GitHub)

Pour eviter tout probleme de facturation GitHub Actions (*GitHub Billing*), les publications NPM et les mises a jour peuvent se faire :

### Option A : Publication Directe en 1 Commande (Depuis votre machine)
```bash
# Pour un correctif de bug (1.0.0 -> 1.0.1)
npm run release:patch

# Pour une nouvelle fonctionnalite (1.0.0 -> 1.1.0)
npm run release:minor

# Pour une version majeure (1.0.0 -> 2.0.0)
npm run release:major
```
*Cette commande unique incremente la version, compile le TypeScript, publie sur NPM, cree le tag Git et le pousse sur GitHub automatiquement.*

### Option B : Publication via GitHub Actions Self-Hosted
Le workflow `.github/workflows/publish.yml` est configure pour tourner exclusivement sur votre propre runner (`runs-on: [self-hosted]`), ce qui garantit **0 EUR de couts GitHub Actions**.

### Option C : Mise a Jour Automatique du CLI
Sur n'importe quel serveur ou machine cliente, tapez simplement :
```bash
deployer update
```

---

## Architecture du Projet

```text
deployer/
├── bin/
│   └── deployer.js                   # Binaire executable Node.js
├── scripts/
│   └── install.sh                    # Bootstrapper curl one-liner
├── src/
│   ├── index.ts                      # Definition des commandes Commander
│   ├── types/
│   │   └── config.ts                 # Types et interfaces TypeScript
│   ├── utils/
│   │   ├── crypto.ts                 # Generateur cryptographique (JWT, Mots de passe)
│   │   ├── logger.ts                 # Affichage stylise avec Chalk
│   │   └── shell.ts                  # Executeur shell securise
│   ├── prompts/
│   │   ├── wizard.ts                 # Assistant interactif principal
│   │   ├── email.prompt.ts           # Selecteur d'email & SMTP
│   │   ├── storage.prompt.ts         # Selecteur de stockage (R2/S3)
│   │   ├── sms.prompt.ts             # Selecteur de passerelle SMS
│   │   └── database.prompt.ts        # Configuration base de donnees
│   ├── system/
│   │   ├── os-detect.ts              # Detection Linux et privileges
│   │   ├── swap.ts                   # Provisioning Swap 2 Go
│   │   ├── firewall.ts               # Configuration pare-feu UFW
│   │   ├── docker.ts                 # Installation Docker Engine & Compose
│   │   ├── nginx.ts                  # Configuration du Reverse Proxy Nginx
│   │   ├── ssl.ts                    # Automatisation Certbot Let's Encrypt
│   │   ├── backup.ts                 # Crontab et scripts de dump
│   │   └── runner.ts                 # Installation du Runner GitHub
│   ├── generators/
│   │   ├── env.generator.ts          # Generateur du fichier .env
│   │   ├── nginx.generator.ts        # Generateur du vhost Nginx
│   │   └── docker-compose.generator.ts # Generateur Docker Compose
│   └── commands/
│       ├── init.command.ts           # Logique de 'deployer init'
│       ├── doctor.command.ts         # Logique de 'deployer doctor'
│       ├── backup.command.ts         # Logique de 'deployer backup'
│       ├── restore.command.ts        # Logique de 'deployer restore'
│       └── runner.command.ts         # Logique de 'deployer runner'
├── package.json
└── tsconfig.json
```

---

## Deploiement Rejouable via Profil JSON

Lors de chaque execution de `deployer init`, un fichier `deployer.config.json` est automatiquement genere avec les permissions restreintes (`chmod 600`).

Pour cloner la meme configuration sur un serveur de secours ou de Staging :
```bash
deployer init --config deployer.config.json
```

---

## Licence
Ce projet est developpe par **AMBO Tech** sous licence MIT.