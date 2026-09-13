/**
 * @fileoverview Commande 'doctor' pour auditer et diagnostiquer l'etat de sante du serveur et des conteneurs.
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
 * Gestionnaire d'audit de sante du serveur.
 */
export class DoctorCommand {
  /**
   * Analyse l'ensemble des composants systeme et affiche un bilan visuel clair.
   *
   * @returns {Promise<void>}
   */
  public static async execute(): Promise<void> {
    Logger.banner();
    Logger.section('Audit de Sante Systeme (AMBO Doctor)');

    // 1. Systeme d'exploitation et ressources materielles
    const sysInfo = await OsDetect.getSystemInfo();
    console.log(chalk.bold('Systeme d\'exploitation :'));
    console.log(`  - OS / Distro    : ${sysInfo.distro} ${sysInfo.release} (${sysInfo.platform}/${sysInfo.arch})`);
    console.log(`  - CPU Cores      : ${sysInfo.cpuCores}`);
    console.log(`  - Memoire RAM    : ${sysInfo.freeMemMb} Mo libres / ${sysInfo.totalMemMb} Mo totaux`);

    // 2. Memoire Swap
    const hasSwap = await SwapManager.hasActiveSwap();
    console.log();
    console.log(chalk.bold('Memoire Virtuelle (Swap) :'));
    if (hasSwap) {
      const swapDetails = await Shell.run('free -h | grep -i swap', { silent: true });
      console.log(chalk.green(`  [OK] Swap actif : ${swapDetails.stdout || 'Active'}`));
    } else {
      console.log(chalk.yellow('  [WARN] Aucun Swap actif (risque de saturation memoire sous forte charge).'));
    }

    // 3. Pare-feu UFW
    console.log();
    console.log(chalk.bold('Securite et Pare-feu (UFW) :'));
    const ufwStatus = await FirewallManager.getStatus();
    console.log(`  ${ufwStatus.split('\n').join('\n  ')}`);

    // 4. Moteur Docker & Compose
    console.log();
    console.log(chalk.bold('Moteur Docker :'));
    const dockerInstalled = await DockerManager.isInstalled();
    if (dockerInstalled) {
      const dockerVer = await Shell.run('docker --version', { silent: true });
      const composeVer = await Shell.run('docker compose version', { silent: true });
      console.log(chalk.green(`  [OK] ${dockerVer.stdout}`));
      console.log(chalk.green(`  [OK] ${composeVer.stdout}`));

      // Liste des conteneurs en cours d'execution
      const psRes = await Shell.run('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', { silent: true });
      if (psRes.success && psRes.stdout) {
        console.log();
        console.log(chalk.bold('Conteneurs en cours d\'execution :'));
        console.log(psRes.stdout);
      }
    } else {
      console.log(chalk.red('  [ERROR] Docker n\'est pas installe sur ce serveur.'));
    }

    // 5. Nginx & Ports Reseau
    console.log();
    console.log(chalk.bold('Serveur Web Nginx :'));
    const hasNginx = await Shell.hasCommand('nginx');
    if (hasNginx) {
      const nginxVer = await Shell.run('nginx -v', { silent: true });
      console.log(chalk.green(`  [OK] ${nginxVer.stderr || nginxVer.stdout || 'Nginx actif'}`));
    } else {
      console.log(chalk.yellow('  [WARN] Nginx n\'est pas installe.'));
    }

    console.log();
    Logger.success('Diagnostic de sante termine.');
  }
}
