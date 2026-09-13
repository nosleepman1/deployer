# 🚀 AMBO Tech — Deployer CLI

> **CLI interactif universel de provisioning de VPS et de déploiement Docker multi-fournisseurs (Google Workspace, OVH, Cloudflare R2, AWS S3, Dexchange SMS).**

---

## 📑 Sommaire
1. [Fonctionnalités Principales](#-fonctionnalités-principales)
2. [Installation en 1 Seule Ligne (VPS Vierge)](#-installation-en-1-seule-ligne-vps-vierge)
3. [Fournisseurs & Intégrations Pris en Charge](#-fournisseurs--intégrations-pris-en-charge)
4. [Commandes Disponibles](#-commandes-disponibles)
5. [Architecture & Fonctionnement Technique](#-architecture--fonctionnement-technique)
6. [Déploiement Rejouable via Profil JSON](#-déploiement-rejouable-via-profil-json)
7. [Licence](#-licence)

---

## 🌟 Fonctionnalités Principales

* 🧙 **Assistant Interactif Terminal (TUI) :** Navigation guidée avec `@clack/prompts`, masquage automatique des mots de passe et validation en temps réel.
* 🛡️ **Sécurisation & Durcissement Automatique de l'OS :**
  * Création et activation d'un espace **Swap de 2 Go** (évite les plantages OOM lors des builds Docker).
  * Configuration stricte du pare-feu **UFW** (Ports 22 SSH, 80 HTTP, 443 HTTPS).
* 🐳 **Moteur Docker & Compose Officiel :**
  * Installation des dépôts APT officiels Docker et du plugin Compose.
  * Gestion des droits utilisateurs sans `sudo`.
* 🔐 **Génération Cryptographique des Secrets :**
  * Mots de passe PostgreSQL et clés `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` générés à haute entropie (384/512 bits).
  * Fichier `.env` créé avec verrouillage strict des droits (`chmod 600`).
* 🌐 **Nginx Reverse Proxy & SSL Let's Encrypt :**
  * VirtualHost Nginx optimisé pour NestJS, WebSockets, IP réelles et gros fichiers (25 Mo).
  * Certificat SSL HTTPS délivré et renouvelé automatiquement par Certbot.
* ⏰ **Sauvegardes Quotidiennes Automatisées :**
  * Dump logique PostgreSQL compressé en `.sql.gz` chaque nuit à 02h00 avec rotation automatique.
* 🤖 **Runner GitHub Actions Self-Hosted :**
  * Connexion d'un agent de build/déploiement continu sans aucun frais de minutes GitHub.

---

## ⚡ Installation en 1 Seule Ligne (VPS Vierge)

Sur un serveur Ubuntu (22.04 / 24.04 LTS) ou Debian neuf, exécutez simplement :

```bash
curl -fsSL https://raw.githubusercontent.com/nosleepman1/deployer/main/scripts/install.sh | bash
```

Le script installe Node.js, clone le CLI, compile le TypeScript et démarre immédiatement l'assistant de configuration.

---

## 🔌 Fournisseurs & Intégrations Pris en Charge

### 📧 Fournisseurs d'Emails (SMTP)
* **Google Workspace / Gmail :** Détection automatique, port 587, instructions intégrées pour le mot de passe d'application 16 caractères.
* **OVH Mail / Pro :** Configuration `ssl0.ovh.net`, port 587.
* **Brevo (ex-Sendinblue) :** Configuration `smtp-relay.brevo.com`.
* **Resend :** API & SMTP `smtp.resend.com:465`.
* **Serveur SMTP Personnalisé :** Saisie personnalisée d'hôte, port et identifiants.

### ☁️ Stockage d'Objets & Médias (S3-Compatible)
* **Cloudflare R2 :** Zéro frais d'egress / bande passante, nom de domaine personnalisé (`media.domaine.sn`).
* **Amazon Web Services (AWS S3) :** Support multi-régions (eu-west-3, etc.).
* **Volume Local Docker :** Stockage direct sur le disque du serveur sans tiers.

### 📱 Passerelles SMS
* **Dexchange SMS :** Passerelle de référence au Sénégal (Orange, Wave, Free Sénégal) avec Sender ID personnalisé.
* **Twilio :** Passerelle mondiale via Account SID et Auth Token.
* **Désactivé :** Mode développement avec logs dans la console.

---

## 🛠️ Commandes Disponibles

Après installation, le binaire `deployer` est accessible globalement dans tout le système :

```bash
# 1. Lancer l'assistant de configuration et de déploiement complet
deployer init

# 2. Lancer un déploiement silencieux à partir d'un fichier de profil JSON
deployer init --config /chemin/vers/deployer.config.json

# 3. Diagnostiquer la santé du serveur (RAM, Swap, Docker, Nginx, Ports)
deployer doctor

# 4. Déclencher une sauvegarde immédiate de la base de données
deployer backup

# 5. Restaurer une sauvegarde existante
deployer restore /var/backups/afd-textile/dump_afd_textile_prod_2026-09-13.sql.gz

# 6. Connecter ou réenregistrer un Runner GitHub Actions Self-Hosted
deployer runner
```

---

## 📐 Architecture du Projet

```text
deployer/
├── bin/
│   └── deployer.js                   # Binaire exécutable Node.js
├── scripts/
│   └── install.sh                    # Bootstrapper curl one-liner
├── src/
│   ├── index.ts                      # Définition des commandes Commander
│   ├── types/
│   │   └── config.ts                 # Types et interfaces TypeScript
│   ├── utils/
│   │   ├── crypto.ts                 # Générateur cryptographique (JWT, Mots de passe)
│   │   ├── logger.ts                 # Affichage stylisé avec Chalk
│   │   └── shell.ts                  # Exécuteur shell sécurisé
│   ├── prompts/
│   │   ├── wizard.ts                 # Assistant interactif principal
│   │   ├── email.prompt.ts           # Sélecteur d'email & SMTP
│   │   ├── storage.prompt.ts         # Sélecteur de stockage (R2/S3)
│   │   ├── sms.prompt.ts             # Sélecteur de passerelle SMS
│   │   └── database.prompt.ts        # Configuration base de données
│   ├── system/
│   │   ├── os-detect.ts              # Détection Linux et privilèges
│   │   ├── swap.ts                   # Provisioning Swap 2 Go
│   │   ├── firewall.ts               # Configuration pare-feu UFW
│   │   ├── docker.ts                 # Installation Docker Engine & Compose
│   │   ├── nginx.ts                  # Configuration du Reverse Proxy Nginx
│   │   ├── ssl.ts                    # Automatisation Certbot Let's Encrypt
│   │   ├── backup.ts                 # Crontab et scripts de dump
│   │   └── runner.ts                 # Installation du Runner GitHub
│   ├── generators/
│   │   ├── env.generator.ts          # Générateur du fichier .env
│   │   ├── nginx.generator.ts        # Générateur du vhost Nginx
│   │   └── docker-compose.generator.ts # Générateur Docker Compose
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

## 💾 Déploiement Rejouable via Profil JSON

Lors de chaque exécution de `deployer init`, un fichier `deployer.config.json` est automatiquement généré avec les permissions restreintes (`chmod 600`).

Pour cloner la même configuration sur un serveur de secours ou de Staging :
```bash
deployer init --config deployer.config.json
```

---

## 📄 Licence
Ce projet est développé par **AMBO Tech** sous licence MIT.