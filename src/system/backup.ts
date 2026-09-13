/**
 * @fileoverview Gestionnaire d'automatisation des sauvegardes de base de données et planification Cron.
 * @module system/backup
 * @author AMBO Tech
 * @license MIT
 */

import * as fs from 'fs';
import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';
import { DatabaseConfig } from '../types/config';

/**
 * Gestionnaire pour la création de scripts de dump logique et l'enregistrement de tâches Crontab.
 */
export class BackupManager {
  /**
   * Installe le script de sauvegarde PostgreSQL et enregistre la tâche planifiée Cron.
   *
   * @param {string} projectDir - Répertoire racine du projet contenant le dossier devops/scripts.
   * @param {DatabaseConfig} db - Configuration de la base de données.
   * @param {number} [hour=2] - Heure de déclenchement quotidienne (0 à 23).
   * @param {number} [retentionDays=14] - Durée de conservation des fichiers en jours.
   * @returns {Promise<boolean>} True si la planification s'est effectuée avec succès.
   */
  public static async setupCron(
    projectDir: string,
    db: DatabaseConfig,
    hour: number = 2,
    retentionDays: number = 14
  ): Promise<boolean> {
    Logger.info(`Mise en place de la sauvegarde automatique quotidienne (${hour}h00, rétention ${retentionDays}j)...`);

    const backupScriptDir = `${projectDir}/devops/scripts`;
    const backupScriptPath = `${backupScriptDir}/backup-db.sh`;

    // 1. Contenu du script de sauvegarde bash universel
    const scriptContent = `#!/usr/bin/env bash
# ==============================================================================
# Script de Sauvegarde Automatisée — Généré par AMBO Deployer
# ==============================================================================
set -e

BACKUP_DIR="/var/backups/afd-textile"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
CONTAINER_NAME="afd_postgres_prod"
DB_NAME="${db.name}"
DB_USER="${db.user}"
RETENTION_DAYS=${retentionDays}

mkdir -p "\${BACKUP_DIR}"
BACKUP_FILE="\${BACKUP_DIR}/dump_\${DB_NAME}_\${TIMESTAMP}.sql.gz"

echo "Démarrage du Dump PostgreSQL : \${DB_NAME} (\${TIMESTAMP})..."
docker exec -t "\${CONTAINER_NAME}" pg_dump -U "\${DB_USER}" -d "\${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip -9 > "\${BACKUP_FILE}"

if [ -f "\${BACKUP_FILE}" ] && [ -s "\${BACKUP_FILE}" ]; then
  FILE_SIZE=$(du -h "\${BACKUP_FILE}" | cut -f1)
  echo "✅ Sauvegarde réussie : \${BACKUP_FILE} (\${FILE_SIZE})"
else
  echo "❌ Erreur : Le fichier de dump est vide !"
  exit 1
fi

# Nettoyage des sauvegardes expirées
find "\${BACKUP_DIR}" -type f -name "dump_\${DB_NAME}_*.sql.gz" -mtime +\${RETENTION_DAYS} -delete
`;

    try {
      // 2. Création du dossier et écriture du script
      await Shell.run(`mkdir -p ${backupScriptDir}`);
      fs.writeFileSync(backupScriptPath, scriptContent, { mode: 0o755 });
      await Shell.run(`chmod +x ${backupScriptPath}`);

      // 3. Ajout dans le crontab de l'utilisateur root
      const cronLine = `0 ${hour} * * * ${backupScriptPath} >> /var/log/afd_db_backup.log 2>&1`;
      const currentCrontabRes = await Shell.run('crontab -l', { silent: true });
      const currentCrontab = currentCrontabRes.success ? currentCrontabRes.stdout : '';

      if (!currentCrontab.includes(backupScriptPath)) {
        const newCrontab = currentCrontab ? `${currentCrontab}\n${cronLine}\n` : `${cronLine}\n`;
        const tempCronFile = '/tmp/new_crontab';
        fs.writeFileSync(tempCronFile, newCrontab, 'utf-8');
        await Shell.run(`crontab ${tempCronFile}`);
        await Shell.run(`rm -f ${tempCronFile}`);
      }

      Logger.success(`Tâche Cron de sauvegarde installée (toutes les nuits à ${hour}h00).`);
      return true;
    } catch (err: any) {
      Logger.error('Impossible d\'installer la sauvegarde automatique :', err);
      return false;
    }
  }

  /**
   * Exécute une sauvegarde immédiate et synchrone de la base de données.
   *
   * @param {string} projectDir - Répertoire racine du projet.
   * @returns {Promise<boolean>} True si la sauvegarde manuelle s'est bien déroulée.
   */
  public static async executeBackupNow(projectDir: string): Promise<boolean> {
    const backupScriptPath = `${projectDir}/devops/scripts/backup-db.sh`;
    Logger.info('Lancement d\'une sauvegarde manuelle immédiate...');
    const res = await Shell.run(`bash ${backupScriptPath}`);
    if (res.success) {
      Logger.success('Sauvegarde manuelle effectuée avec succès !');
      console.log(res.stdout);
      return true;
    } else {
      Logger.error('Échec de la sauvegarde :', res.stderr);
      return false;
    }
  }
}
