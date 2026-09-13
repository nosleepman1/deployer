/**
 * @fileoverview Commande 'update' pour verifier et mettre a jour automatiquement le CLI AMBO Deployer.
 * @module commands/update
 * @author AMBO Tech
 * @license MIT
 */

import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Gestionnaire pour la verification et la mise a jour automatique du CLI.
 */
export class UpdateCommand {
  /**
   * Recupere la version actuelle du package localement.
   *
   * @returns {string} Version locale (ex: '1.0.0').
   */
  public static getCurrentVersion(): string {
    try {
      const pkgPath = path.join(__dirname, '..', '..', 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        return pkg.version || '1.0.0';
      }
    } catch {
      // Ignorer
    }
    return '1.0.0';
  }

  /**
   * Verifie si une nouvelle version est disponible sur le registre NPM.
   *
   * @param {string} packageName - Nom du package sur NPM.
   * @returns {Promise<string | null>} Derniere version distante disponible ou null.
   */
  public static async getLatestNpmVersion(packageName: string = '@nosleepman/deployer'): Promise<string | null> {
    const res = await Shell.run(`npm show ${packageName} version`, { silent: true });
    if (res.success && res.stdout) {
      return res.stdout.trim();
    }
    return null;
  }

  /**
   * Execute la mise a jour automatique du CLI (via NPM global ou Git pull).
   *
   * @returns {Promise<void>}
   */
  public static async execute(): Promise<void> {
    Logger.banner();
    Logger.section('Mise a jour d\'AMBO Deployer');

    const currentVersion = this.getCurrentVersion();
    Logger.info(`Version actuelle installee : v${currentVersion}`);
    Logger.info('Verification des mises a jour disponibles...');

    const latestVersion = await this.getLatestNpmVersion();

    if (latestVersion && latestVersion !== currentVersion) {
      Logger.info(`Nouvelle version detectee : v${latestVersion}`);
      Logger.info('Telechargement et mise a jour en cours...');

      // 1. Tenter la mise a jour via npm global
      const npmUpdateRes = await Shell.run('npm install -g @nosleepman/deployer@latest');
      if (npmUpdateRes.success) {
        Logger.success(`AMBO Deployer mis a jour avec succes vers la version v${latestVersion} !`);
        return;
      }
    }

    // 2. Si installe via Git (/opt/ambo-deployer ou repo local)
    const gitDir = path.join(__dirname, '..', '..');
    const isGitRepo = fs.existsSync(path.join(gitDir, '.git'));

    if (isGitRepo) {
      Logger.info('Mise a jour via le depot Git...');
      const pullRes = await Shell.run('git pull origin main', { cwd: gitDir });
      if (pullRes.success) {
        await Shell.run('npm install --loglevel=error', { cwd: gitDir });
        await Shell.run('npm run build', { cwd: gitDir });
        Logger.success('Mise a jour Git et recompilation terminees avec succes !');
        return;
      }
    }

    if (latestVersion === currentVersion) {
      Logger.success(`Vous utilisez deja la toute derniere version disponible (v${currentVersion}).`);
    } else {
      Logger.info('Le CLI est a jour.');
    }
  }
}
