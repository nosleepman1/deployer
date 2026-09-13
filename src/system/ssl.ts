/**
 * @fileoverview Gestionnaire de certificats SSL HTTPS automatisés via Let's Encrypt et Certbot.
 * @module system/ssl
 * @author AMBO Tech
 * @license MIT
 */

import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';

/**
 * Gestionnaire pour la génération, l'application et le renouvellement de certificats SSL gratuits Let's Encrypt.
 */
export class SslManager {
  /**
   * Génère et applique un certificat SSL HTTPS pour le nom de domaine spécifié.
   *
   * @param {string} domainName - Nom de domaine complet (ex: api.afd-textile.sn).
   * @param {string} email - Email de contact administrateur pour Let's Encrypt.
   * @returns {Promise<boolean>} True si le certificat a été délivré et activé dans Nginx.
   */
  public static async obtainCertificate(domainName: string, email: string): Promise<boolean> {
    Logger.info(`Génération du certificat SSL Let's Encrypt pour ${domainName}...`);

    const certbotCmd = `sudo certbot --nginx -d ${domainName} --non-interactive --agree-tos --email ${email} --redirect`;
    const res = await Shell.run(certbotCmd);

    if (!res.success) {
      Logger.error(`Échec de la génération du certificat SSL pour ${domainName}.`, res.stderr);
      Logger.warn('Assurez-vous que l\'enregistrement DNS de type A pointe bien vers l\'adresse IP publique de ce serveur.');
      return false;
    }

    Logger.success(`Certificat SSL HTTPS activé avec succès pour https://${domainName} !`);
    return true;
  }

  /**
   * Teste le renouvellement automatique (Dry-Run) du certificat SSL.
   *
   * @returns {Promise<boolean>} True si le test de renouvellement automatique réussit.
   */
  public static async testRenewal(): Promise<boolean> {
    Logger.info('Vérification du système de renouvellement automatique SSL...');
    const res = await Shell.run('sudo certbot renew --dry-run', { silent: true });

    if (res.success) {
      Logger.success('Le renouvellement automatique Let\'s Encrypt est pleinement opérationnel.');
      return true;
    } else {
      Logger.warn('Le test de renouvellement a retourné un avertissement.');
      return false;
    }
  }
}
