/**
 * @fileoverview Gestionnaire d'installation et de pilotage de Docker Engine et Docker Compose.
 * @module system/docker
 * @author AMBO Tech
 * @license MIT
 */

import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';

/**
 * Gestionnaire pour l'installation des dépôts officiels Docker et le contrôle des conteneurs.
 */
export class DockerManager {
  /**
   * Vérifie si Docker et le plugin Docker Compose sont installés sur le système.
   *
   * @returns {Promise<boolean>} True si Docker et Docker Compose sont disponibles.
   */
  public static async isInstalled(): Promise<boolean> {
    const hasDocker = await Shell.hasCommand('docker');
    if (!hasDocker) return false;

    const composeCheck = await Shell.run('docker compose version', { silent: true });
    return composeCheck.success;
  }

  /**
   * Installe la dernière version officielle et stable de Docker Engine et Docker Compose sur Ubuntu/Debian.
   *
   * @returns {Promise<boolean>} True si l'installation s'est terminée avec succès.
   */
  public static async installDocker(): Promise<boolean> {
    const installed = await this.isInstalled();
    if (installed) {
      Logger.info('Docker Engine et Docker Compose sont déjà installés sur le système.');
      return true;
    }

    Logger.info('Installation des paquets officiels Docker Engine & Compose...');

    // 1. Suppression des anciens paquets conflictuels
    await Shell.run('sudo apt-get remove -y docker docker-engine docker.io containerd runc || true', { silent: true });

    // 2. Préparation du trousseau de clés GPG officiel Docker
    await Shell.run('sudo install -m 0755 -d /etc/apt/keyrings');
    await Shell.run('sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc');
    await Shell.run('sudo chmod a+r /etc/apt/keyrings/docker.asc');

    // 3. Ajout du dépôt APT officiel
    const addRepoScript =
      'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null';
    await Shell.run(addRepoScript);

    // 4. Mise à jour de la liste des paquets et installation
    await Shell.run('sudo apt-get update');
    const installRes = await Shell.run(
      'sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin'
    );

    if (!installRes.success) {
      Logger.error('Échec de l\'installation des paquets Docker.');
      return false;
    }

    // 5. Ajout de l'utilisateur courant au groupe docker pour éviter l'usage de sudo
    const currentUser = process.env.USER || 'ubuntu';
    await Shell.run(`sudo usermod -aG docker ${currentUser}`);

    Logger.success('Docker Engine et Docker Compose installés avec succès.');
    return true;
  }

  /**
   * Démarre ou reconstruit une pile Docker Compose en arrière-plan.
   *
   * @param {string} composeFilePath - Chemin vers le fichier docker-compose.yml ou docker-compose.prod.yml.
   * @param {string} [workingDir] - Répertoire d'exécution du projet.
   * @returns {Promise<boolean>} True si les conteneurs ont démarré sans erreur.
   */
  public static async composeUp(composeFilePath: string, workingDir?: string): Promise<boolean> {
    Logger.info(`Lancement de la stack Docker Compose (${composeFilePath})...`);
    const cmd = `docker compose -f ${composeFilePath} up -d --build --remove-orphans`;
    const res = await Shell.run(cmd, { cwd: workingDir });

    if (!res.success) {
      Logger.error('Erreur lors du démarrage des conteneurs Docker.');
      return false;
    }

    Logger.success('Conteneurs Docker démarrés et opérationnels.');
    return true;
  }

  /**
   * Récupère le statut de tous les conteneurs de la pile.
   *
   * @param {string} composeFilePath - Chemin vers le fichier docker-compose.
   * @param {string} [workingDir] - Répertoire de travail.
   * @returns {Promise<string>} Sortie texte du statut `docker compose ps`.
   */
  public static async composeStatus(composeFilePath: string, workingDir?: string): Promise<string> {
    const res = await Shell.run(`docker compose -f ${composeFilePath} ps`, { cwd: workingDir, silent: true });
    return res.stdout || 'Aucun conteneur actif';
  }
}
