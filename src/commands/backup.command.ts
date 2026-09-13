/**
 * @fileoverview Commande 'backup' pour déclencher une sauvegarde manuelle de la base de données.
 * @module commands/backup
 * @author AMBO Tech
 * @license MIT
 */

import { BackupManager } from '../system/backup';
import { Logger } from '../utils/logger';

/**
 * Gestionnaire pour déclencher une sauvegarde immédiate de la base de données.
 */
export class BackupCommand {
  /**
   * Exécute le dump immédiat de la base PostgreSQL.
   *
   * @param {string} [projectDir='/var/www/afd-textile/backend'] - Répertoire du projet.
   * @returns {Promise<void>}
   */
  public static async execute(projectDir: string = '/var/www/afd-textile/backend'): Promise<void> {
    Logger.banner();
    Logger.section('💾 Déclenchement d\'une Sauvegarde PostgreSQL');
    await BackupManager.executeBackupNow(projectDir);
  }
}
