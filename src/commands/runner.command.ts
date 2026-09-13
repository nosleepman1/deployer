/**
 * @fileoverview Commande 'runner' pour enregistrer et configurer un GitHub Runner Self-Hosted de manière autonome.
 * @module commands/runner
 * @author AMBO Tech
 * @license MIT
 */

import * as p from '@clack/prompts';
import { RunnerManager } from '../system/runner';
import { Logger } from '../utils/logger';

/**
 * Gestionnaire pour la commande autonome de connexion du Runner GitHub Actions.
 */
export class RunnerCommand {
  /**
   * Lance l'assistant interactif de configuration du Runner.
   *
   * @param {Object} [options={}] - Options de ligne de commande.
   * @param {string} [options.url] - URL du dépôt GitHub.
   * @param {string} [options.token] - Jeton d'enregistrement GitHub Actions.
   * @returns {Promise<void>}
   */
  public static async execute(options: { url?: string; token?: string } = {}): Promise<void> {
    Logger.banner();
    Logger.section('🤖 Configuration du Runner GitHub Actions Self-Hosted');

    let repoUrl = options.url;
    let runnerToken = options.token;

    if (!repoUrl) {
      const urlInput = await p.text({
        message: 'URL complète du dépôt GitHub cible :',
        placeholder: 'https://github.com/AMBO-tech/AFD-Textite-backend',
        validate: (v) => (!v.startsWith('http') ? 'Veuillez renseigner une URL valide.' : undefined),
      });
      if (p.isCancel(urlInput)) process.exit(0);
      repoUrl = urlInput as string;
    }

    if (!runnerToken) {
      const tokenInput = await p.password({
        message: 'Jeton d\'enregistrement GitHub (Settings > Actions > Runners > New runner) :',
        mask: '•',
        validate: (v) => (!v.trim() ? 'Le jeton d\'enregistrement est obligatoire.' : undefined),
      });
      if (p.isCancel(tokenInput)) process.exit(0);
      runnerToken = tokenInput as string;
    }

    await RunnerManager.setupRunner({
      enabled: true,
      repoUrl,
      runnerToken,
      runnerName: 'vps-runner',
    });
  }
}
