/**
 * @fileoverview Gestionnaire d'installation et de pilotage du Runner GitHub Actions Self-Hosted.
 * @module system/runner
 * @author AMBO Tech
 * @license MIT
 */

import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';
import { GitHubRunnerConfig } from '../types/config';

/**
 * Gestionnaire pour télécharger, enregistrer et démarrer un agent d'exécution GitHub Actions sur le VPS.
 */
export class RunnerManager {
  /**
   * Installe et démarre le Runner GitHub Actions sous forme de service d'arrière-plan.
   *
   * @param {GitHubRunnerConfig} config - Configuration du dépôt et jeton d'enregistrement.
   * @returns {Promise<boolean>} True si le runner est actif et prêt à recevoir des jobs.
   */
  public static async setupRunner(config: GitHubRunnerConfig): Promise<boolean> {
    if (!config.enabled || !config.repoUrl || !config.runnerToken) {
      Logger.info('Configuration du Runner GitHub ignorée (non activée ou informations manquantes).');
      return true;
    }

    Logger.info(`Installation du Runner GitHub Actions Self-Hosted pour ${config.repoUrl}...`);

    const runnerDir = '/opt/actions-runner';
    const runnerVersion = '2.321.0';
    const runnerTar = `actions-runner-linux-x64-${runnerVersion}.tar.gz`;
    const runnerUrl = `https://github.com/actions/runner/releases/download/v${runnerVersion}/${runnerTar}`;

    // 1. Création du dossier du runner
    await Shell.run(`sudo mkdir -p ${runnerDir}`);
    const currentUser = process.env.USER || 'ubuntu';
    await Shell.run(`sudo chown -R ${currentUser}:${currentUser} ${runnerDir}`);

    // 2. Téléchargement et extraction de l'archive officielle
    Logger.info(`Téléchargement de l'archive du Runner v${runnerVersion}...`);
    await Shell.run(`curl -o ${runnerDir}/${runnerTar} -L ${runnerUrl}`, { cwd: runnerDir });
    await Shell.run(`tar xzf ${runnerDir}/${runnerTar}`, { cwd: runnerDir });

    // 3. Enregistrement auprès de GitHub
    Logger.info('Enregistrement du runner auprès du dépôt GitHub...');
    const runnerName = config.runnerName || 'vps-runner';
    const configCmd = `./config.sh --url "${config.repoUrl}" --token "${config.runnerToken}" --name "${runnerName}" --labels "self-hosted,linux,x64,docker" --unattended --replace`;

    const configRes = await Shell.run(configCmd, { cwd: runnerDir });
    if (!configRes.success) {
      Logger.error('Échec de l\'enregistrement du Runner GitHub :', configRes.stderr);
      return false;
    }

    // 4. Installation et démarrage du service systemd
    Logger.info('Installation du service systemd pour le démarrage automatique...');
    await Shell.run('sudo ./svc.sh install', { cwd: runnerDir });
    await Shell.run('sudo ./svc.sh start', { cwd: runnerDir });

    Logger.success('Runner GitHub Actions Self-Hosted connecté et en écoute (Statut : Idle) !');
    return true;
  }
}
