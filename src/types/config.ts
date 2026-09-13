/**
 * @fileoverview Définitions de types, interfaces et énumérations pour l'outil de déploiement AMBO Deployer.
 * @module types/config
 * @author AMBO Tech
 * @license MIT
 */

/**
 * Fournisseurs de messagerie électronique pris en charge par le système.
 *
 * @enum {string}
 */
export enum EmailProviderType {
  /** Service Google Gmail ou Google Workspace avec mot de passe d'application */
  GOOGLE = 'google',
  /** Hébergement de messagerie mutualisée ou dédiée OVH Telecom */
  OVH = 'ovh',
  /** Plateforme transactionnelle Brevo (ex-Sendinblue) */
  BREVO = 'brevo',
  /** Service d'envoi d'emails moderne Resend */
  RESEND = 'resend',
  /** Serveur SMTP générique personnalisé */
  CUSTOM_SMTP = 'custom_smtp',
  /** Désactiver l'envoi d'emails */
  DISABLED = 'disabled',
}

/**
 * Configuration détaillée du fournisseur d'emails.
 *
 * @interface EmailConfig
 */
export interface EmailConfig {
  /** Type de fournisseur sélectionné */
  provider: EmailProviderType;
  /** Hôte du serveur SMTP (ex: smtp.gmail.com, ssl0.ovh.net) */
  smtpHost?: string;
  /** Port du serveur SMTP (généralement 587 pour STARTTLS ou 465 pour SSL) */
  smtpPort?: number;
  /** Nom d'utilisateur ou adresse email d'authentification SMTP */
  smtpUser?: string;
  /** Mot de passe SMTP ou mot de passe d'application Google (16 caractères) */
  smtpPassword?: string;
  /** Adresse email d'expédition affichée aux destinataires (Header From) */
  smtpFrom?: string;
  /** Adresse email de l'administrateur recevant les alertes système critiques */
  ownerNotificationEmail?: string;
}

/**
 * Fournisseurs de stockage d'objets (S3-compatible) supportés.
 *
 * @enum {string}
 */
export enum StorageProviderType {
  /** Cloudflare R2 (Stockage sans frais d'egress / bande passante) */
  CLOUDFLARE_R2 = 'cloudflare_r2',
  /** Amazon Web Services Simple Storage Service (AWS S3) */
  AWS_S3 = 'aws_s3',
  /** Stockage persistant sur le volume local du serveur */
  LOCAL = 'local',
}

/**
 * Configuration détaillée du stockage d'objets ou de médias.
 *
 * @interface StorageConfig
 */
export interface StorageConfig {
  /** Type de fournisseur de stockage */
  provider: StorageProviderType;
  /** URL de l'endpoint S3 (ex: https://<account_id>.r2.cloudflarestorage.com) */
  endpoint?: string;
  /** Nom du conteneur / bucket de stockage */
  bucketName?: string;
  /** Identifiant de la clé d'accès (Access Key ID) */
  accessKeyId?: string;
  /** Clé secrète d'accès (Secret Access Key) */
  secretAccessKey?: string;
  /** Région AWS ou Cloudflare (ex: auto, eu-west-3) */
  region?: string;
  /** Nom de domaine public personnalisé servant les fichiers multimédias */
  publicDomain?: string;
}

/**
 * Passerelles d'envoi de SMS OTP et notifications mobiles.
 *
 * @enum {string}
 */
export enum SmsProviderType {
  /** Passerelle Dexchange SMS (Sénégal / Zone UEMOA) */
  DEXCHANGE = 'dexchange',
  /** Plateforme de communication globale Twilio */
  TWILIO = 'twilio',
  /** Désactiver l'envoi de SMS (mode développement ou simulation) */
  DISABLED = 'disabled',
}

/**
 * Configuration détaillée de la passerelle SMS.
 *
 * @interface SmsConfig
 */
export interface SmsConfig {
  /** Fournisseur de SMS sélectionné */
  provider: SmsProviderType;
  /** URL de base de l'API SMS */
  apiUrl?: string;
  /** Clé d'API ou Token d'authentification */
  apiKey?: string;
  /** Nom de l'expéditeur affiché sur le téléphone mobile du client (Sender ID) */
  senderId?: string;
  /** Identifiant de compte (requis pour Twilio : Account SID) */
  accountSid?: string;
}

/**
 * Moteurs de base de données relationnels ou NoSQL.
 *
 * @enum {string}
 */
export enum DatabaseType {
  /** Base de données relationnelle avancée PostgreSQL */
  POSTGRESQL = 'postgres',
  /** Base de données relationnelle MySQL / MariaDB */
  MYSQL = 'mysql',
  /** Base de données orientée documents MongoDB */
  MONGODB = 'mongodb',
}

/**
 * Paramètres de configuration de la base de données.
 *
 * @interface DatabaseConfig
 */
export interface DatabaseConfig {
  /** Type de base de données */
  type: DatabaseType;
  /** Nom de la base de données applicative */
  name: string;
  /** Nom d'utilisateur administrateur de la base */
  user: string;
  /** Mot de passe sécurisé d'accès à la base */
  password: string;
  /** Port d'écoute du conteneur ou serveur (ex: 5432) */
  port: number;
  /** Activer les migrations automatiques Prisma au démarrage du conteneur */
  autoMigrate: boolean;
}

/**
 * Configuration des clés de sécurité et d'authentification JSON Web Token (JWT).
 *
 * @interface SecurityConfig
 */
export interface SecurityConfig {
  /** Clé secrète de signature des jetons d'accès (Access Token) */
  jwtAccessSecret: string;
  /** Clé secrète de signature des jetons de rafraîchissement (Refresh Token) */
  jwtRefreshSecret: string;
  /** Durée de validité des jetons d'accès (ex: 15m) */
  jwtAccessExpiration: string;
  /** Durée de validité des jetons de rafraîchissement (ex: 7d) */
  jwtRefreshExpiration: string;
  /** Durée de validité des codes SMS OTP en secondes (ex: 300) */
  otpExpirationSeconds: number;
}

/**
 * Configuration du nom de domaine et du certificat SSL.
 *
 * @interface DomainConfig
 */
export interface DomainConfig {
  /** Nom de domaine principal (ex: api.afd-textile.sn) */
  domainName: string;
  /** Liste des domaines autorisés pour le partage de ressources cross-origin (CORS) */
  corsOrigins: string[];
  /** Adresse email de contact pour les renouvellements Let's Encrypt */
  sslEmail: string;
  /** Port interne exposé par le conteneur applicatif Docker (ex: 3000) */
  appPort: number;
}

/**
 * Configuration du Runner GitHub Actions Self-Hosted.
 *
 * @interface GitHubRunnerConfig
 */
export interface GitHubRunnerConfig {
  /** Activer l'installation et la configuration automatique du Runner */
  enabled: boolean;
  /** URL complète du dépôt GitHub cible (ex: https://github.com/AMBO-tech/AFD-Textite-backend) */
  repoUrl?: string;
  /** Jeton d'enregistrement temporaire fourni par l'interface GitHub */
  runnerToken?: string;
  /** Nom unique attribué au runner sur l'interface GitHub Actions */
  runnerName?: string;
}

/**
 * Configuration globale et exhaustive d'un déploiement de projet.
 *
 * @interface DeploymentConfig
 */
export interface DeploymentConfig {
  /** Identifiant ou nom normalisé du projet (ex: afd-textile) */
  projectName: string;
  /** Environnement d'exécution cible ('production' | 'staging') */
  environment: 'production' | 'staging';
  /** Répertoire racine d'installation sur le serveur hôte (ex: /var/www/afd-textile) */
  targetDir: string;
  /** Configuration du nom de domaine et du reverse proxy */
  domain: DomainConfig;
  /** Configuration de la base de données */
  database: DatabaseConfig;
  /** Paramètres de chiffrement et d'authentification */
  security: SecurityConfig;
  /** Configuration du service d'emails */
  email: EmailConfig;
  /** Configuration du stockage d'objets */
  storage: StorageConfig;
  /** Configuration de la passerelle SMS */
  sms: SmsConfig;
  /** Configuration optionnelle du Runner GitHub Actions */
  runner: GitHubRunnerConfig;
  /** Taille du fichier swap en Go (par défaut 2) */
  swapSizeGb: number;
  /** Heure d'exécution du cron de sauvegarde quotidienne (format 24h, ex: 2 pour 02h00) */
  backupHour: number;
  /** Nombre de jours de conservation des sauvegardes compressées */
  backupRetentionDays: number;
}
