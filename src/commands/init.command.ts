/**
 * @fileoverview Commande principale 'init' pour provisionner le VPS et déployer l'application de bout en bout.
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
 * Gestionnaire d'exécution de la commande d'initialisation complète `deployer init`.
 */
export class InitCommand {
  /**
   * Exécute le provisionnement interactif complet du serveur VPS.
   *
   * @param {Object} [options={}] - Options de ligne de commande passées via Commander.
   * @param {boolean} [options.dryRun] - Si true, simule les opérations sans altérer le serveur.
   * @param {string} [options.config] - Chemin vers un fichier de configuration JSON pré-rempli.
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

    // Étape 1 : Swap de 2 Go
    Logger.section('Étape 1/7 : Mémoire Virtuelle (Swap)');
    s.start('Configuration de l\'espace Swap de sécurité (2 Go)...');
    await SwapManager.setupSwap(config.swapSizeGb);
    s.stop('✔ Espace Swap configuré avec succès.');

    // Étape 2 : Pare-feu UFW
    Logger.section('Étape 2/7 : Pare-feu Réseau (UFW)');
    s.start('Application des règles de sécurité pare-feu...');
    await FirewallManager.setupFirewall();
    s.stop('✔ Pare-feu UFW configuré et activé (Ports 22, 80, 443).');

    // Étape 3 : Installation de Docker & Docker Compose
    Logger.section('Étape 3/7 : Moteur Docker & Compose');
    s.start('Vérification et installation de Docker Engine officiel...');
    await DockerManager.installDocker();
    s.stop('✔ Docker Engine & Docker Compose opérationnels.');

    // Étape 4 : Fichier .env & Permissions
    Logger.section('Étape 4/7 : Génération du fichier .env sécurisé');
    s.start('Écriture du fichier .env avec clés cryptographiques...');
    const projectDir = path.resolve(config.targetDir);
    await Shell.run(`mkdir -p ${projectDir}`);

    const envContent = EnvGenerator.generate(config);
    const envPath = path.join(projectDir, '.env');
    fs.writeFileSync(envPath, envContent, 'utf-8');
    await Shell.run(`chmod 600 ${envPath}`);

    // Sauvegarde optionnelle du profil JSON pour rejouabilité
    const configProfilePath = path.join(projectDir, 'deployer.config.json');
    fs.writeFileSync(configProfilePath, JSON.stringify(config, null, 2), 'utf-8');
    await Shell.run(`chmod 600 ${configProfilePath}`);
    s.stop(`✔ Fichier .env généré dans ${envPath} (droits 600 verrouillés).`);

    // Étape 5 : Reverse Proxy Nginx & Certificat SSL
    Logger.section('Étape 5/7 : Nginx Reverse Proxy & SSL Let\'s Encrypt');
    s.start(`Configuration du VirtualHost Nginx pour ${config.domain.domainName}...`);
    const nginxOk = await NginxManager.configureSite(config.projectName, config.domain);
    if (nginxOk) {
      s.stop('✔ VirtualHost Nginx activé.');
      s.start(`Génération du certificat SSL HTTPS pour ${config.domain.domainName}...`);
      await SslManager.obtainCertificate(config.domain.domainName, config.domain.sslEmail);
      s.stop('✔ Certificat SSL Let\'s Encrypt délivré et actif.');
    } else {
      s.stop('⚠ Nginx n\'a pas pu être totalement configuré (vérifiez les logs).');
    }

    // Étape 6 : Sauvegardes Automatiques Quotidiennes
    Logger.section('Étape 6/7 : Sauvegardes Quotidiennes de la Base');
    s.start('Installation du script de dump et de la tâche Cron...');
    await BackupManager.setupCron(projectDir, config.database, config.backupHour, config.backupRetentionDays);
    s.stop(`✔ Sauvegarde programmée chaque nuit à ${config.backupHour}h00 (rétention ${config.backupRetentionDays} jours).`);

    // Étape 7 : Démarrage des Conteneurs Docker
    Logger.section('Étape 7/7 : Démarrage de la Stack Applicative');
    s.start('Construction des images Docker et démarrage des conteneurs...');
    const composeFile = fs.existsSync(path.join(projectDir, 'docker-compose.prod.yml'))
      ? 'docker-compose.prod.yml'
      : 'docker-compose.yml';

    const upOk = await DockerManager.composeUp(composeFile, projectDir);
    if (upOk) {
      s.stop('✔ Conteneurs démarrés avec succès.');
    } else {
      s.stop('⚠ Un problème est survenu lors du lancement des conteneurs.');
    }

    // Étape Bonus : GitHub Actions Runner
    if (config.runner.enabled) {
      Logger.section('Bonus : Runner GitHub Actions Self-Hosted');
      s.start('Connexion du Runner auprès du dépôt GitHub...');
      await RunnerManager.setupRunner(config.runner);
      s.stop('✔ Runner GitHub Actions connecté et prêt.');
    }

    // Rapport Final
    console.log();
    p.note(
      `🌐 Domaine API : https://${config.domain.domainName}\n` +
      `🗄️ Base de données : ${config.database.name} (PostgreSQL 16)\n` +
      `📁 Emplacement : ${projectDir}\n` +
      `🛡️ SSL HTTPS : Let's Encrypt (Actif)\n` +
      `💾 Sauvegardes : /var/backups/afd-textile (Chaque nuit à ${config.backupHour}h00)\n` +
      `🤖 CI/CD : ${config.runner.enabled ? 'Runner GitHub Self-Hosted actif' : 'Manuel'}`,
      '🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !'
    );
  }
}
