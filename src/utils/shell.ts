/**
 * @fileoverview Exécuteur de commandes shell sécurisé avec gestion des erreurs et journalisation.
 * @module utils/shell
 * @author AMBO Tech
 * @license MIT
 */

import { exec, ExecOptions } from 'child_process';
import { promisify } from 'util';
import { Logger } from './logger';

const execAsync = promisify(exec);

/**
 * Résultat de l'exécution d'une commande shell.
 *
 * @interface ShellResult
 */
export interface ShellResult {
  /** Code de sortie (0 pour succès) */
  code: number;
  /** Flux de sortie standard capturé */
  stdout: string;
  /** Flux d'erreur standard capturé */
  stderr: string;
  /** Indique si la commande a réussi (code 0) */
  success: boolean;
}

/**
 * Options d'exécution de commandes système.
 *
 * @interface ShellOptions
 */
export interface ShellOptions extends ExecOptions {
  /** Si true, n'affiche pas les logs en cas d'erreur bénigne */
  silent?: boolean;
  /** Si true, n'exécute pas la commande mais simule l'affichage (mode Dry-Run) */
  dryRun?: boolean;
}

/**
 * Classe utilitaire pour interagir avec le système d'exploitation sous-jacent.
 */
export class Shell {
  /**
   * Exécute une commande shell de manière asynchrone avec retour typé.
   *
   * @param {string} command - Commande shell complète à exécuter.
   * @param {ShellOptions} [options={}] - Options d'exécution (cwd, env, silent, dryRun).
   * @returns {Promise<ShellResult>} Résultat détaillé de la commande.
   *
   * @example
   * ```typescript
   * const result = await Shell.run('docker --version');
   * if (result.success) {
   *   console.log(`Version installée : ${result.stdout}`);
   * }
   * ```
   */
  public static async run(command: string, options: ShellOptions = {}): Promise<ShellResult> {
    if (options.dryRun || process.env.DRY_RUN === 'true') {
      Logger.info(`[DRY-RUN] Exécution simulée : ${command}`);
      return {
        code: 0,
        stdout: '[DRY-RUN SIMULATION OUTPUT]',
        stderr: '',
        success: true,
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10 Mo de buffer
        ...options,
      });

      return {
        code: 0,
        stdout: String(stdout).trim(),
        stderr: String(stderr).trim(),
        success: true,
      };
    } catch (error: any) {
      const stdout = error.stdout ? String(error.stdout).trim() : '';
      const stderr = error.stderr ? String(error.stderr).trim() : error.message || '';
      const code = typeof error.code === 'number' ? error.code : 1;

      if (!options.silent) {
        Logger.error(`Échec de la commande : ${command}`, stderr || stdout);
      }

      return {
        code,
        stdout,
        stderr,
        success: false,
      };
    }
  }

  /**
   * Vérifie si un binaire ou une commande est disponible dans le PATH système.
   *
   * @param {string} commandName - Nom du binaire (ex: 'docker', 'nginx', 'certbot').
   * @returns {Promise<boolean>} True si la commande existe et est exécutable.
   */
  public static async hasCommand(commandName: string): Promise<boolean> {
    const isWindows = process.platform === 'win32';
    const checkCmd = isWindows ? `where ${commandName}` : `command -v ${commandName}`;
    const result = await this.run(checkCmd, { silent: true });
    return result.success;
  }
}
