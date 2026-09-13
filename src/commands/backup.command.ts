/**
 * @fileoverview Commande 'backup' pour declencher une sauvegarde manuelle de la base de donnees.
 * @module commands/backup
 * @author AMBO Tech
 * @license MIT
 */

import { BackupManager } from '../system/backup';
import { Logger } from '../utils/logger';

/**
 * Gestionnaire pour declencher une sauvegarde immediate de la base de donnees.
 */
export class BackupCommand {
  /**
   * Execute le dump immediat de la base PostgreSQL.
   *
   * @param {string} [projectDir='/var/www/afd-textile/backend'] - Repertoire du projet.
   * @returns {Promise<void>}
   */
  public static async execute(projectDir: string = '/var/www/afd-textile/backend'): Promise<void> {
    Logger.banner();
    Logger.section('Declenchement d\'une Sauvegarde PostgreSQL');
    await BackupManager.executeBackupNow(projectDir);
  }
}
