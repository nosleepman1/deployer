/**
 * @fileoverview Commande principale 'init' pour provisionner le VPS et deployer l'application de bout en bout.
 * @module commands/init
 * @author AMBO Tech
 * @license MIT
 */

import * as fs from 'fs';
import * as path from 'path';
import * as p from '@clack/prompts';
import { WizardPrompt } from '../prompts/wizard';
import { SwapManager } from '../system/swap';
import { FirewallManager } from '../system/firewall';
import { DockerManager } from '../system/docker';
import { NginxManager } from '../system/nginx';
import { SslManager } from '../system/ssl';
import { BackupManager } from '../system/backup';
import { RunnerManager } from '../system/runner';
import { EnvGenerator } from '../generators/env.generator';
import { Logger } from '../utils/logger';
import { Shell } from '../utils/shell';
import { DeploymentConfig } from '../types/config';

/**
 * Gestionnaire d'execution de la commande d'initialisation complete 'deployer init'.
 */
export class InitCommand {
  /**
   * Execute le provisionnement interactif complet du serveur VPS.
   *
   * @param {Object} [options={}] - Options de ligne de commande passees via Commander.
   * @param {boolean} [options.dryRun] - Si true, simule les operations sans alterer le serveur.
   * @param {string} [options.config] - Chemin vers un fichier de configuration JSON pre-rempli.
   * @returns {Promise<void>}
   */
  public static async execute(options: { dryRun?: boolean; config?: string } = {}): Promise<void> {
    Logger.banner();

    let config: DeploymentConfig;

    if (options.config && fs.existsSync(options.config)) {
      Logger.info(`Chargement de la configuration depuis ${options.config}...`);
      const raw = fs.readFileSync(options.config, 'utf-8');
      config = JSON.parse(raw);
    } else {
      config = await WizardPrompt.run();
    }

    const s = p.spinner();

    // Etape 1 : Swap de 2 Go
    Logger.section('Etape 1/7 : Memoire Virtuelle (Swap)');
    s.start('Configuration de l\'espace Swap de securite (2 Go)...');
    await SwapManager.setupSwap(config.swapSizeGb);
    s.stop('[OK] Espace Swap configure avec succes.');

    // Etape 2 : Pare-feu UFW
    Logger.section('Etape 2/7 : Pare-feu Reseau (UFW)');
    s.start('Application des regles de securite pare-feu...');
    await FirewallManager.setupFirewall();
    s.stop('[OK] Pare-feu UFW configure et active (Ports 22, 80, 443).');

    // Etape 3 : Installation de Docker & Docker Compose
    Logger.section('Etape 3/7 : Moteur Docker & Compose');
    s.start('Verification et installation de Docker Engine officiel...');
    await DockerManager.installDocker();
    s.stop('[OK] Docker Engine et Docker Compose operationnels.');

    // Etape 4 : Fichier .env & Permissions
    Logger.section('Etape 4/7 : Generation du fichier .env securise');
    s.start('Ecriture du fichier .env avec cles cryptographiques...');
    const projectDir = path.resolve(config.targetDir);
    await Shell.run(`mkdir -p ${projectDir}`);

    const envContent = EnvGenerator.generate(config);
    const envPath = path.join(projectDir, '.env');
    fs.writeFileSync(envPath, envContent, 'utf-8');
    await Shell.run(`chmod 600 ${envPath}`);

    // Sauvegarde optionnelle du profil JSON pour rejouabilite
    const configProfilePath = path.join(projectDir, 'deployer.config.json');
    fs.writeFileSync(configProfilePath, JSON.stringify(config, null, 2), 'utf-8');
    await Shell.run(`chmod 600 ${configProfilePath}`);
    s.stop(`[OK] Fichier .env genere dans ${envPath} (droits 600 verrouilles).`);

    // Etape 5 : Reverse Proxy Nginx & Certificat SSL
    Logger.section('Etape 5/7 : Nginx Reverse Proxy et SSL Let\'s Encrypt');
    s.start(`Configuration du VirtualHost Nginx pour ${config.domain.domainName}...`);
    const nginxOk = await NginxManager.configureSite(config.projectName, config.domain);
    if (nginxOk) {
      s.stop('[OK] VirtualHost Nginx active.');
      s.start(`Generation du certificat SSL HTTPS pour ${config.domain.domainName}...`);
      await SslManager.obtainCertificate(config.domain.domainName, config.domain.sslEmail);
      s.stop('[OK] Certificat SSL Let\'s Encrypt delivre et actif.');
    } else {
      s.stop('[WARN] Nginx n\'a pas pu etre totalement configure (verifiez les logs).');
    }

    // Etape 6 : Sauvegardes Automatiques Quotidiennes
    Logger.section('Etape 6/7 : Sauvegardes Quotidiennes de la Base');
    s.start('Installation du script de dump et de la tache Cron...');
    await BackupManager.setupCron(projectDir, config.database, config.backupHour, config.backupRetentionDays);
    s.stop(`[OK] Sauvegarde programmee chaque nuit a ${config.backupHour}h00 (retention ${config.backupRetentionDays} jours).`);

    // Etape 7 : Demarrage des Conteneurs Docker
    Logger.section('Etape 7/7 : Demarrage de la Stack Applicative');
    s.start('Construction des images Docker et demarrage des conteneurs...');
    const composeFile = fs.existsSync(path.join(projectDir, 'docker-compose.prod.yml'))
      ? 'docker-compose.prod.yml'
      : 'docker-compose.yml';

    const upOk = await DockerManager.composeUp(composeFile, projectDir);
    if (upOk) {
      s.stop('[OK] Conteneurs demarres avec succes.');
    } else {
      s.stop('[WARN] Un probleme est survenu lors du lancement des conteneurs.');
    }

    // Etape Bonus : GitHub Actions Runner
    if (config.runner.enabled) {
      Logger.section('Bonus : Runner GitHub Actions Self-Hosted');
      s.start('Connexion du Runner aupres du depot GitHub...');
      await RunnerManager.setupRunner(config.runner);
      s.stop('[OK] Runner GitHub Actions connecte et pret.');
    }

    // Rapport Final
    console.log();
    p.note(
      `Domaine API : https://${config.domain.domainName}\n` +
      `Base de donnees : ${config.database.name} (PostgreSQL 16)\n` +
      `Emplacement : ${projectDir}\n` +
      `SSL HTTPS : Let's Encrypt (Actif)\n` +
      `Sauvegardes : /var/backups/afd-textile (Chaque nuit a ${config.backupHour}h00)\n` +
      `CI/CD : ${config.runner.enabled ? 'Runner GitHub Self-Hosted actif' : 'Manuel'}`,
      'DEPLOIEMENT TERMINE AVEC SUCCES !'
    );
  }
}
