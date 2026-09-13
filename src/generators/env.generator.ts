/**
 * @fileoverview Générateur de fichiers d'environnement (.env) hautement sécurisés.
 * @module generators/env
 * @author AMBO Tech
 * @license MIT
 */

import { DeploymentConfig, EmailProviderType, SmsProviderType, StorageProviderType } from '../types/config';

/**
 * Générateur pour structurer et exporter les variables d'environnement de production.
 */
export class EnvGenerator {
  /**
   * Génère le contenu texte complet du fichier `.env` à partir de la configuration.
   *
   * @param {DeploymentConfig} config - Configuration globale du projet.
   * @returns {string} Contenu structuré et commenté du fichier `.env`.
   */
  public static generate(config: DeploymentConfig): string {
    const lines: string[] = [];

    // En-tête
    lines.push('# ==============================================================================');
    lines.push(`# CONFIGURATION DE ${config.environment.toUpperCase()} — ${config.projectName.toUpperCase()}`);
    lines.push('# Généré automatiquement par AMBO Tech Deployer');
    lines.push('# ==============================================================================');
    lines.push('');

    // Environnement Applicatif
    lines.push('# ENVIRONNEMENT & SERVEUR');
    lines.push(`NODE_ENV=${config.environment}`);
    lines.push(`PORT=${config.domain.appPort}`);
    lines.push('HOST=0.0.0.0');
    lines.push(`CORS_ORIGIN=${config.domain.corsOrigins.join(',')}`);
    lines.push('');

    // Base de Données
    lines.push('# BASE DE DONNÉES');
    lines.push(`DATABASE_USER=${config.database.user}`);
    lines.push(`DATABASE_PASSWORD=${config.database.password}`);
    lines.push(`DATABASE_NAME=${config.database.name}`);
    lines.push(`DATABASE_AUTO_MIGRATE=${config.database.autoMigrate}`);
    lines.push(`DATABASE_URL="postgresql://${config.database.user}:${config.database.password}@postgres:5432/${config.database.name}?schema=public"`);
    lines.push('');

    // Sécurité & JWT
    lines.push('# SÉCURITÉ JWT & AUTHENTIFICATION');
    lines.push(`JWT_ACCESS_SECRET="${config.security.jwtAccessSecret}"`);
    lines.push(`JWT_REFRESH_SECRET="${config.security.jwtRefreshSecret}"`);
    lines.push(`JWT_ACCESS_EXPIRATION=${config.security.jwtAccessExpiration}`);
    lines.push(`JWT_REFRESH_EXPIRATION=${config.security.jwtRefreshExpiration}`);
    lines.push(`OTP_EXPIRATION_SECONDS=${config.security.otpExpirationSeconds}`);
    lines.push('');

    // Stockage Médias (S3 / R2)
    lines.push('# STOCKAGE MÉDIAS & FICHIERS');
    if (config.storage.provider === StorageProviderType.CLOUDFLARE_R2) {
      lines.push('STORAGE_PROVIDER=cloudflare_r2');
      lines.push(`R2_ENDPOINT=${config.storage.endpoint || ''}`);
      lines.push(`R2_ACCESS_KEY_ID=${config.storage.accessKeyId || ''}`);
      lines.push(`R2_SECRET_ACCESS_KEY=${config.storage.secretAccessKey || ''}`);
      lines.push(`R2_BUCKET_NAME=${config.storage.bucketName || ''}`);
      lines.push(`R2_PUBLIC_DOMAIN=${config.storage.publicDomain || ''}`);
    } else if (config.storage.provider === StorageProviderType.AWS_S3) {
      lines.push('STORAGE_PROVIDER=aws_s3');
      lines.push(`AWS_REGION=${config.storage.region || 'eu-west-3'}`);
      lines.push(`AWS_ACCESS_KEY_ID=${config.storage.accessKeyId || ''}`);
      lines.push(`AWS_SECRET_ACCESS_KEY=${config.storage.secretAccessKey || ''}`);
      lines.push(`AWS_BUCKET_NAME=${config.storage.bucketName || ''}`);
      lines.push(`AWS_PUBLIC_DOMAIN=${config.storage.publicDomain || ''}`);
    } else {
      lines.push('STORAGE_PROVIDER=local');
      lines.push('LOCAL_STORAGE_PATH=/app/uploads');
    }
    lines.push('');

    // Passerelle SMS
    lines.push('# PASSERELLE SMS');
    if (config.sms.provider === SmsProviderType.DEXCHANGE) {
      lines.push('SMS_PROVIDER=dexchange');
      lines.push(`DEXCHANGE_SMS_API_URL=${config.sms.apiUrl || 'https://api.dexchange-sms.com/v1'}`);
      lines.push(`DEXCHANGE_SMS_API_KEY=${config.sms.apiKey || ''}`);
      lines.push(`DEXCHANGE_SMS_SENDER_ID=${config.sms.senderId || 'AFD_TEXTILE'}`);
    } else if (config.sms.provider === SmsProviderType.TWILIO) {
      lines.push('SMS_PROVIDER=twilio');
      lines.push(`TWILIO_ACCOUNT_SID=${config.sms.accountSid || ''}`);
      lines.push(`TWILIO_AUTH_TOKEN=${config.sms.apiKey || ''}`);
      lines.push(`TWILIO_FROM_NUMBER=${config.sms.senderId || ''}`);
    } else {
      lines.push('SMS_PROVIDER=disabled');
    }
    lines.push('');

    // Service Emails & SMTP
    lines.push('# NOTIFICATIONS EMAILS & SMTP');
    if (config.email.provider !== EmailProviderType.DISABLED) {
      lines.push(`SMTP_HOST=${config.email.smtpHost || ''}`);
      lines.push(`SMTP_PORT=${config.email.smtpPort || 587}`);
      lines.push(`SMTP_USER=${config.email.smtpUser || ''}`);
      lines.push(`SMTP_PASSWORD=${config.email.smtpPassword || ''}`);
      lines.push(`SMTP_FROM="${config.email.smtpFrom || ''}"`);
      lines.push(`OWNER_NOTIFICATION_EMAIL=${config.email.ownerNotificationEmail || ''}`);
    } else {
      lines.push('SMTP_PROVIDER=disabled');
    }
    lines.push('');

    return lines.join('\n');
  }
}
