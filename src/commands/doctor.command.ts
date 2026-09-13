/**
 * @fileoverview Commande 'doctor' pour auditer et diagnostiquer l'état de santé du serveur et des conteneurs.
 * @module commands/doctor
 * @author AMBO Tech
 * @license MIT
 */

import { OsDetect } from '../system/os-detect';
import { SwapManager } from '../system/swap';
import { FirewallManager } from '../system/firewall';
import { DockerManager } from '../system/docker';
import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';
import chalk from 'chalk';

/**
 * Gestionnaire d'audit de santé du serveur.
 */
export class DoctorCommand {
  /**
   * Analyse l'ensemble des composants système et affiche un bilan visuel clair.
   *
   * @returns {Promise<void>}
   */
  public static async execute(): Promise<void> {
    Logger.banner();
    Logger.section('🩺 Audit de Santé Système (AMBO Doctor)');

    // 1. Système d'exploitation et ressources matérielles
    const sysInfo = await OsDetect.getSystemInfo();
    console.log(chalk.bold('Système d\'exploitation :'));
    console.log(`  • OS / Distro    : ${sysInfo.distro} ${sysInfo.release} (${sysInfo.platform}/${sysInfo.arch})`);
    console.log(`  • CPU Cores      : ${sysInfo.cpuCores}`);
    console.log(`  • Mémoire RAM    : ${sysInfo.freeMemMb} Mo libres / ${sysInfo.totalMemMb} Mo totaux`);

    // 2. Mémoire Swap
    const hasSwap = await SwapManager.hasActiveSwap();
    console.log();
    console.log(chalk.bold('Mémoire Virtuelle (Swap) :'));
    if (hasSwap) {
      const swapDetails = await Shell.run('free -h | grep -i swap', { silent: true });
      console.log(chalk.green(`  ✔ Swap actif : ${swapDetails.stdout || 'Activé'}`));
    } else {
      console.log(chalk.yellow('  ⚠ Aucun Swap actif (risque de crash OOM sous forte charge).'));
    }

    // 3. Pare-feu UFW
    console.log();
    console.log(chalk.bold('Sécurité & Pare-feu (UFW) :'));
    const ufwStatus = await FirewallManager.getStatus();
    console.log(`  ${ufwStatus.split('\n').join('\n  ')}`);

    // 4. Moteur Docker & Compose
    console.log();
    console.log(chalk.bold('Moteur Docker :'));
    const dockerInstalled = await DockerManager.isInstalled();
    if (dockerInstalled) {
      const dockerVer = await Shell.run('docker --version', { silent: true });
      const composeVer = await Shell.run('docker compose version', { silent: true });
      console.log(chalk.green(`  ✔ ${dockerVer.stdout}`));
      console.log(chalk.green(`  ✔ ${composeVer.stdout}`));

      // Liste des conteneurs en cours d'exécution
      const psRes = await Shell.run('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', { silent: true });
      if (psRes.success && psRes.stdout) {
        console.log();
        console.log(chalk.bold('Conteneurs en cours d\'exécution :'));
        console.log(psRes.stdout);
      }
    } else {
      console.log(chalk.red('  ✖ Docker n\'est pas installé sur ce serveur.'));
    }

    // 5. Nginx & Ports Réseau
    console.log();
    console.log(chalk.bold('Serveur Web Nginx :'));
    const hasNginx = await Shell.hasCommand('nginx');
    if (hasNginx) {
      const nginxVer = await Shell.run('nginx -v', { silent: true });
      console.log(chalk.green(`  ✔ ${nginxVer.stderr || nginxVer.stdout || 'Nginx actif'}`));
    } else {
      console.log(chalk.yellow('  ⚠ Nginx n\'est pas installé.'));
    }

    console.log();
    Logger.success('Diagnostic de santé terminé.');
  }
}
