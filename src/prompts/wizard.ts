/**
 * @fileoverview Assistant interactif complet (Wizard) orchestrant toutes les étapes de configuration.
 * @module prompts/wizard
 * @author AMBO Tech
 * @license MIT
 */

import * as p from '@clack/prompts';
import { DeploymentConfig } from '../types/config';
import { CryptoUtils } from '../utils/crypto';
import { EmailPrompt } from './email.prompt';
import { StoragePrompt } from './storage.prompt';
import { SmsPrompt } from './sms.prompt';
import { DatabasePrompt } from './database.prompt';

/**
 * Assistant principal guidant l'utilisateur à travers la saisie de tous les paramètres du serveur et de l'application.
 */
export class WizardPrompt {
  /**
   * Lance le parcours interactif complet pour recueillir l'ensemble de la configuration du projet.
   *
   * @param {Partial<DeploymentConfig>} [initialValues={}] - Valeurs par défaut optionnelles.
   * @returns {Promise<DeploymentConfig>} Configuration de déploiement prête à l'emploi.
   */
  public static async run(initialValues: Partial<DeploymentConfig> = {}): Promise<DeploymentConfig> {
    p.intro('🚀 AMBO Tech — Assistant de Déploiement & Configuration VPS');

    // 1. Informations Générales sur le Projet
    const projectName = await p.text({
      message: '📌 Quel est le nom du projet applicatif ?',
      initialValue: initialValues.projectName || 'afd-textile',
      validate: (v) => (!v.trim() ? 'Le nom du projet est requis.' : undefined),
    });
    if (p.isCancel(projectName)) process.exit(0);

    const environment = (await p.select({
      message: '🌍 Quel est l\'environnement de déploiement cible ?',
      options: [
        { value: 'production', label: 'Production (Optimisé, logs stricts, SSL HTTPS actif)' },
        { value: 'staging', label: 'Staging / Recette (Tests préalables)' },
      ],
      initialValue: initialValues.environment || 'production',
    })) as 'production' | 'staging';
    if (p.isCancel(environment)) process.exit(0);

    const targetDir = await p.text({
      message: '📁 Quel est le répertoire d\'installation sur le serveur ?',
      initialValue: initialValues.targetDir || `/var/www/${(projectName as string).toLowerCase()}/backend`,
      validate: (v) => (!v.trim() ? 'Le répertoire est requis.' : undefined),
    });
    if (p.isCancel(targetDir)) process.exit(0);

    // 2. Nom de Domaine, Reverse Proxy & SSL
    p.log.step('🌐 Configuration Réseau, Domaine & SSL');

    const domainName = await p.text({
      message: 'Nom de domaine de l\'API (ex: api.mondomaine.sn) :',
      initialValue: initialValues.domain?.domainName || 'api.afd-textile.sn',
      validate: (v) => (!v.trim() ? 'Le nom de domaine est obligatoire.' : undefined),
    });
    if (p.isCancel(domainName)) process.exit(0);

    const corsInput = await p.text({
      message: 'Domaines autorisés pour les requêtes CORS (séparés par une virgule) :',
      initialValue: initialValues.domain?.corsOrigins?.join(',') || `https://${projectName}.sn,https://app.${projectName}.sn`,
    });
    if (p.isCancel(corsInput)) process.exit(0);
    const corsOrigins = (corsInput as string).split(',').map((s) => s.trim()).filter(Boolean);

    const sslEmail = await p.text({
      message: 'Adresse email pour les alertes d\'expiration SSL Let\'s Encrypt :',
      initialValue: initialValues.domain?.sslEmail || 'ambo.techh@gmail.com',
      validate: (v) => (!v.includes('@') ? 'Une adresse email valide est requise.' : undefined),
    });
    if (p.isCancel(sslEmail)) process.exit(0);

    const appPortInput = await p.text({
      message: 'Port HTTP interne du conteneur Backend :',
      initialValue: String(initialValues.domain?.appPort || 3000),
    });
    if (p.isCancel(appPortInput)) process.exit(0);
    const appPort = parseInt(appPortInput as string, 10) || 3000;

    // 3. Base de Données
    p.log.step('🗄️ Configuration de la Base de Données');
    const database = await DatabasePrompt.prompt(projectName as string);

    // 4. Sécurité & Authentification JWT
    p.log.step('🔐 Sécurité Cryptographique & Tokens JWT');
    const autoJwt = await p.confirm({
      message: 'Générer automatiquement des clés secrètes JWT ultra-sécurisées (HMAC 384 bits) ?',
      initialValue: true,
    });
    if (p.isCancel(autoJwt)) process.exit(0);

    let jwtAccessSecret = '';
    let jwtRefreshSecret = '';

    if (autoJwt) {
      jwtAccessSecret = CryptoUtils.generateBase64Secret(48);
      jwtRefreshSecret = CryptoUtils.generateBase64Secret(48);
      p.log.success('Clés JWT générées avec succès (Base64).');
    } else {
      const accSec = await p.password({ message: 'JWT Access Secret :' });
      if (p.isCancel(accSec)) process.exit(0);
      jwtAccessSecret = accSec as string;

      const refSec = await p.password({ message: 'JWT Refresh Secret :' });
      if (p.isCancel(refSec)) process.exit(0);
      jwtRefreshSecret = refSec as string;
    }

    const security = {
      jwtAccessSecret,
      jwtRefreshSecret,
      jwtAccessExpiration: '15m',
      jwtRefreshExpiration: '7d',
      otpExpirationSeconds: 300,
    };

    // 5. Fournisseur d'Emails
    p.log.step('📧 Configuration du Service d\'Emails (SMTP)');
    const email = await EmailPrompt.prompt(`"Équipe ${projectName}" <noreply@${domainName}>`);

    // 6. Stockage de Fichiers & Médias
    p.log.step('☁️ Configuration du Stockage Médias (S3 / R2)');
    const storage = await StoragePrompt.prompt(projectName as string);

    // 7. Passerelle SMS
    p.log.step('📱 Configuration de la Passerelle SMS');
    const sms = await SmsPrompt.prompt((projectName as string).toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 11));

    // 8. GitHub Actions Runner Self-Hosted
    p.log.step('🤖 Intégration Continue (GitHub Actions Runner)');
    const enableRunner = await p.confirm({
      message: 'Voulez-vous connecter un Runner GitHub Actions Self-Hosted sur ce serveur (Zéro coût CI/CD) ?',
      initialValue: false,
    });
    if (p.isCancel(enableRunner)) process.exit(0);

    let runnerConfig = { enabled: false, repoUrl: '', runnerToken: '', runnerName: `${projectName}-vps-runner` };

    if (enableRunner) {
      const repoUrl = await p.text({
        message: 'URL complète du dépôt GitHub :',
        placeholder: 'https://github.com/AMBO-tech/AFD-Textite-backend',
        validate: (v) => (!v.startsWith('http') ? 'Veuillez saisir une URL de dépôt valide.' : undefined),
      });
      if (p.isCancel(repoUrl)) process.exit(0);

      const runnerToken = await p.password({
        message: 'GitHub Runner Registration Token (copié depuis Settings > Actions > Runners) :',
        mask: '•',
        validate: (v) => (!v.trim() ? 'Le token GitHub Runner est requis.' : undefined),
      });
      if (p.isCancel(runnerToken)) process.exit(0);

      runnerConfig = {
        enabled: true,
        repoUrl: repoUrl as string,
        runnerToken: runnerToken as string,
        runnerName: `${projectName}-vps-runner`,
      };
    }

    // 9. Paramètres Système et Sauvegardes
    const swapSizeGb = 2;
    const backupHour = 2; // 02h00
    const backupRetentionDays = 14;

    const config: DeploymentConfig = {
      projectName: projectName as string,
      environment,
      targetDir: targetDir as string,
      domain: {
        domainName: domainName as string,
        corsOrigins,
        sslEmail: sslEmail as string,
        appPort,
      },
      database,
      security,
      email,
      storage,
      sms,
      runner: runnerConfig,
      swapSizeGb,
      backupHour,
      backupRetentionDays,
    };

    p.outro('✔ Configuration recueillie avec succès !');

    return config;
  }
}
