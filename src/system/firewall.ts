/**
 * @fileoverview Gestionnaire de pare-feu réseau Uncomplicated Firewall (UFW).
 * @module system/firewall
 * @author AMBO Tech
 * @license MIT
 */

import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';

/**
 * Gestionnaire pour configurer et durcir la politique de sécurité réseau du serveur.
 */
export class FirewallManager {
  /**
   * Configure les règles de filtrage UFW (bloque tout par défaut, autorise SSH, HTTP, HTTPS).
   *
   * @param {number[]} [customPorts=[]] - Liste de ports TCP supplémentaires à autoriser.
   * @returns {Promise<boolean>} True si le pare-feu a été configuré et activé.
   */
  public static async setupFirewall(customPorts: number[] = []): Promise<boolean> {
    Logger.info('Configuration de la politique de sécurité UFW...');

    // 1. Installation de ufw si absent
    await Shell.run('sudo apt-get update && sudo apt-get install -y ufw', { silent: true });

    // 2. Définition des règles par défaut
    await Shell.run('sudo ufw default deny incoming', { silent: true });
    await Shell.run('sudo ufw default allow outgoing', { silent: true });

    // 3. Autoriser SSH (Port 22) impérativement pour ne pas couper l'accès distant
    await Shell.run('sudo ufw allow 22/tcp', { silent: true });

    // 4. Autoriser le trafic Web HTTP (80) et HTTPS (443)
    await Shell.run('sudo ufw allow 80/tcp', { silent: true });
    await Shell.run('sudo ufw allow 443/tcp', { silent: true });

    // 5. Ports personnalisés éventuels
    for (const port of customPorts) {
      await Shell.run(`sudo ufw allow ${port}/tcp`, { silent: true });
    }

    // 6. Activation du pare-feu
    const enableRes = await Shell.run('sudo ufw --force enable');
    if (!enableRes.success) {
      Logger.error('Impossible d\'activer UFW.');
      return false;
    }

    Logger.success('Pare-feu UFW activé avec succès (Ports 22, 80, 443 ouverts).');
    return true;
  }

  /**
   * Récupère le statut actuel du pare-feu UFW.
   *
   * @returns {Promise<string>} Sortie texte du statut ufw.
   */
  public static async getStatus(): Promise<string> {
    const res = await Shell.run('sudo ufw status verbose', { silent: true });
    return res.stdout || 'Statut UFW indisponible';
  }
}
