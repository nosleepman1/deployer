/**
 * @fileoverview Utilitaires cryptographiques pour la génération de mots de passe, tokens et clés secrètes.
 * @module utils/crypto
 * @author AMBO Tech
 * @license MIT
 */

import * as crypto from 'crypto';

/**
 * Classe utilitaire pour la génération de chaînes aléatoires à haute entropie
 * conformes aux exigences de sécurité cryptographique.
 */
export class CryptoUtils {
  /**
   * Génère un mot de passe aléatoire hautement sécurisé au format hexadécimal.
   *
   * @param {number} [bytes=24] - Nombre d'octets d'entropie (donne une chaîne de bytes * 2 caractères).
   * @returns {string} Chaîne hexadécimale aléatoire sécurisée.
   *
   * @example
   * ```typescript
   * const dbPassword = CryptoUtils.generateHexPassword(24);
   * // Exemple de retour: "3f9a7b1c4e8d2a6f5e9c0b1a2d3e4f5a6b7c8d9e0f1a2b3c"
   * ```
   */
  public static generateHexPassword(bytes: number = 24): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Génère une clé secrète sécurisée encodée en Base64, idéale pour les signatures JWT (HMAC-SHA256/512).
   *
   * @param {number} [bytes=48] - Nombre d'octets d'entropie (48 octets = 384 bits de sécurité).
   * @returns {string} Chaîne encodée en Base64 URL-safe.
   *
   * @example
   * ```typescript
   * const jwtSecret = CryptoUtils.generateBase64Secret(48);
   * ```
   */
  public static generateBase64Secret(bytes: number = 48): string {
    return crypto.randomBytes(bytes).toString('base64');
  }

  /**
   * Génère un mot de passe lisible contenant des lettres, des chiffres et des symboles de ponctuation.
   *
   * @param {number} [length=20] - Longueur totale du mot de passe souhaitée.
   * @returns {string} Mot de passe complexe généré.
   */
  public static generateComplexPassword(length: number = 20): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    let result = '';
    const randomValues = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }

    return result;
  }
}
