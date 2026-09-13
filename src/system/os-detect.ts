/**
 * @fileoverview Détection de l'environnement d'exécution Linux et vérification des privilèges système.
 * @module system/os-detect
 * @author AMBO Tech
 * @license MIT
 */

import * as os from 'os';
import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';

/**
 * Informations sur le système d'exploitation hôte.
 *
 * @interface SystemInfo
 */
export interface SystemInfo {
  /** Plateforme Node.js (ex: 'linux', 'win32', 'darwin') */
  platform: string;
  /** Architecture du processeur (ex: 'x64', 'arm64') */
  arch: string;
  /** Nom de la distribution Linux (ex: 'Ubuntu', 'Debian') */
  distro: string;
  /** Version de la distribution */
  release: string;
  /** Mémoire vive totale en mégaoctets */
  totalMemMb: number;
  /** Mémoire vive libre en mégaoctets */
  freeMemMb: number;
  /** Nombre de cœurs CPU */
  cpuCores: number;
  /** Indique si le script dispose des privilèges root / sudo */
  isRoot: boolean;
}

/**
 * Classe utilitaire pour identifier les capacités matérielles et logicielles du serveur.
 */
export class OsDetect {
  /**
   * Analyse et extrait les caractéristiques système complètes du serveur.
   *
   * @returns {Promise<SystemInfo>} Informations système détaillées.
   */
  public static async getSystemInfo(): Promise<SystemInfo> {
    const platform = os.platform();
    const arch = os.arch();
    const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
    const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
    const cpuCores = os.cpus().length;

    let distro = 'Unknown';
    let release = os.release();
    let isRoot = false;

    if (platform === 'linux') {
      const osReleaseRes = await Shell.run('cat /etc/os-release', { silent: true });
      if (osReleaseRes.success) {
        const nameMatch = osReleaseRes.stdout.match(/^NAME="?([^"\n]+)"?/m);
        const versionMatch = osReleaseRes.stdout.match(/^VERSION_ID="?([^"\n]+)"?/m);
        if (nameMatch) distro = nameMatch[1];
        if (versionMatch) release = versionMatch[1];
      }

      const idRes = await Shell.run('id -u', { silent: true });
      if (idRes.success && idRes.stdout === '0') {
        isRoot = true;
      }
    } else if (platform === 'win32') {
      distro = 'Windows';
      isRoot = true;
    }

    return {
      platform,
      arch,
      distro,
      release,
      totalMemMb,
      freeMemMb,
      cpuCores,
      isRoot,
    };
  }

  /**
   * Vérifie que le script s'exécute sur un environnement Linux pris en charge (Ubuntu/Debian).
   *
   * @throws {Error} Si l'environnement n'est pas compatible et que l'utilisateur force l'exécution.
   * @returns {Promise<boolean>} True si le système est compatible.
   */
  public static async assertSupportedLinux(): Promise<boolean> {
    const info = await this.getSystemInfo();

    if (info.platform !== 'linux') {
      Logger.warn(`Système détecté : ${info.platform} (${info.distro}). Les commandes Docker/Nginx ciblent un VPS Linux Ubuntu/Debian.`);
      return false;
    }

    return true;
  }
}
