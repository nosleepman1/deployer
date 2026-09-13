/**
 * @fileoverview Module de saisie interactive pour la configuration de la base de données.
 * @module prompts/database
 * @author AMBO Tech
 * @license MIT
 */

import * as p from '@clack/prompts';
import { DatabaseConfig, DatabaseType } from '../types/config';
import { CryptoUtils } from '../utils/crypto';

/**
 * Assistant interactif pour la configuration de la base de données relationnelle.
 */
export class DatabasePrompt {
  /**
   * Pose les questions de configuration et génère automatiquement les identifiants si demandé.
   *
   * @param {string} projectName - Nom du projet pour pré-remplir les noms de base par défaut.
   * @returns {Promise<DatabaseConfig>} Configuration complète de la base de données.
   */
  public static async prompt(projectName: string): Promise<DatabaseConfig> {
    const type = (await p.select({
      message: '🗄️ Quel moteur de base de données souhaitez-vous déployer ?',
      options: [
        {
          value: DatabaseType.POSTGRESQL,
          label: 'PostgreSQL 16 (Recommandé avec Prisma & NestJS)',
          hint: 'Hautes performances relationnelles, transactions robustes',
        },
        {
          value: DatabaseType.MYSQL,
          label: 'MySQL 8 / MariaDB',
          hint: 'Base relationnelle classique',
        },
      ],
    })) as DatabaseType;

    if (p.isCancel(type)) process.exit(0);

    const defaultDbName = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_prod`;
    const defaultUser = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_admin`;

    const dbName = await p.text({
      message: 'Nom de la base de données :',
      initialValue: defaultDbName,
      validate: (v) => (!v.trim() ? 'Le nom de base est requis.' : undefined),
    });
    if (p.isCancel(dbName)) process.exit(0);

    const dbUser = await p.text({
      message: 'Nom de l\'utilisateur administrateur de la base :',
      initialValue: defaultUser,
      validate: (v) => (!v.trim() ? 'L\'utilisateur est requis.' : undefined),
    });
    if (p.isCancel(dbUser)) process.exit(0);

    const autoGenerate = await p.confirm({
      message: 'Générer automatiquement un mot de passe sécurisé à haute entropie (48 hex chars) ?',
      initialValue: true,
    });
    if (p.isCancel(autoGenerate)) process.exit(0);

    let password = '';
    if (autoGenerate) {
      password = CryptoUtils.generateHexPassword(24);
      p.log.info(`🔑 Mot de passe généré : ${password.substring(0, 8)}... (sauvegardé dans .env)`);
    } else {
      const customPass = await p.password({
        message: 'Saisissez votre mot de passe de base de données :',
        mask: '•',
        validate: (v) => (v.length < 8 ? 'Le mot de passe doit contenir au moins 8 caractères.' : undefined),
      });
      if (p.isCancel(customPass)) process.exit(0);
      password = customPass as string;
    }

    const port = type === DatabaseType.POSTGRESQL ? 5432 : 3306;

    const autoMigrate = await p.confirm({
      message: 'Exécuter automatiquement les migrations Prisma / DB au démarrage du conteneur ?',
      initialValue: true,
    });
    if (p.isCancel(autoMigrate)) process.exit(0);

    return {
      type,
      name: (dbName as string).trim(),
      user: (dbUser as string).trim(),
      password,
      port,
      autoMigrate: Boolean(autoMigrate),
    };
  }
}
