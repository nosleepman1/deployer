/**
 * @fileoverview Commande 'restore' pour restaurer un dump SQL compresse dans la base de donnees.
 * @module commands/restore
 * @author AMBO Tech
 * @license MIT
 */

import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';
import * as fs from 'fs';

/**
 * Gestionnaire pour restaurer une sauvegarde de base de donnees.
 */
export class RestoreCommand {
  /**
   * Restaure un fichier de dump .sql.gz dans le conteneur PostgreSQL actif.
   *
   * @param {string} dumpFilePath - Chemin absolu vers le fichier de dump compresse.
   * @param {string} [containerName='afd_postgres_prod'] - Nom du conteneur PostgreSQL.
   * @param {string} [dbName='afd_textile_prod'] - Nom de la base de donnees.
   * @param {string} [dbUser='afd_admin'] - Nom de l'utilisateur administrateur.
   * @returns {Promise<void>}
   */
  public static async execute(
    dumpFilePath: string,
    containerName: string = 'afd_postgres_prod',
    dbName: string = 'afd_textile_prod',
    dbUser: string = 'afd_admin'
  ): Promise<void> {
    Logger.banner();
    Logger.section('Restauration de Base de Donnees PostgreSQL');

    if (!fs.existsSync(dumpFilePath)) {
      Logger.error(`Le fichier de sauvegarde specifie est introuvable : ${dumpFilePath}`);
      return;
    }

    Logger.info(`Restauration depuis : ${dumpFilePath}`);
    Logger.info(`Cible : Conteneur ${containerName} / Base : ${dbName}`);

    const cmd = `gunzip -c "${dumpFilePath}" | docker exec -i "${containerName}" psql -U "${dbUser}" -d "${dbName}"`;
    const res = await Shell.run(cmd);

    if (res.success) {
      Logger.success('Restauration de la base de donnees terminee avec succes !');
    } else {
      Logger.error('Erreur lors de la restauration :', res.stderr);
    }
  }
}
