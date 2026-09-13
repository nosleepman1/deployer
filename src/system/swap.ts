/**
 * @fileoverview Gestionnaire de mémoire virtuelle (Swap) pour prévenir les saturations de RAM.
 * @module system/swap
 * @author AMBO Tech
 * @license MIT
 */

import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';

/**
 * Gestionnaire pour la création, l'activation et la persistance du fichier d'échange (Swap).
 */
export class SwapManager {
  /**
   * Vérifie si un fichier ou une partition de Swap est déjà active.
   *
   * @returns {Promise<boolean>} True si au moins un espace Swap est actif.
   */
  public static async hasActiveSwap(): Promise<boolean> {
    const res = await Shell.run('swapon --show', { silent: true });
    return res.success && res.stdout.length > 0;
  }

  /**
   * Configure et active un fichier Swap de la taille spécifiée (par défaut 2 Go).
   *
   * @param {number} [sizeGb=2] - Taille du swap en gigaoctets.
   * @returns {Promise<boolean>} True si l'opération a réussi.
   */
  public static async setupSwap(sizeGb: number = 2): Promise<boolean> {
    const hasSwap = await this.hasActiveSwap();
    if (hasSwap) {
      Logger.info('Un espace Swap est déjà configuré et actif sur ce serveur.');
      return true;
    }

    Logger.info(`Création d'un fichier Swap de ${sizeGb} Go (/swapfile)...`);

    // 1. Allocation de l'espace disque
    const allocRes = await Shell.run(`sudo fallocate -l ${sizeGb}G /swapfile`);
    if (!allocRes.success) {
      // Fallback avec dd si fallocate n'est pas supporté par le système de fichiers
      await Shell.run(`sudo dd if=/dev/zero of=/swapfile bs=1M count=${sizeGb * 1024}`);
    }

    // 2. Sécurisation des permissions (lecture/écriture root uniquement)
    await Shell.run('sudo chmod 600 /swapfile');

    // 3. Initialisation de la zone de swap
    const mkswapRes = await Shell.run('sudo mkswap /swapfile');
    if (!mkswapRes.success) {
      Logger.error('Échec de la commande mkswap sur /swapfile.');
      return false;
    }

    // 4. Activation immédiate
    const swaponRes = await Shell.run('sudo swapon /swapfile');
    if (!swaponRes.success) {
      Logger.error('Échec de l\'activation swapon.');
      return false;
    }

    // 5. Persistance dans /etc/fstab si absent
    const fstabCheck = await Shell.run('grep -q "/swapfile" /etc/fstab', { silent: true });
    if (!fstabCheck.success) {
      await Shell.run('echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab');
    }

    Logger.success(`Swap de ${sizeGb} Go configuré et activé avec succès.`);
    return true;
  }
}
