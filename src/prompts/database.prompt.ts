/**
 * @fileoverview Module de saisie interactive pour la configuration de la base de donnees.
 * @module prompts/database
 * @author AMBO Tech
 * @license MIT
 */

import * as p from '@clack/prompts';
import { DatabaseConfig, DatabaseType } from '../types/config';
import { CryptoUtils } from '../utils/crypto';

/**
 * Assistant interactif pour la configuration de la base de donnees relationnelle.
 */
export class DatabasePrompt {
  /**
   * Pose les questions de configuration et genere automatiquement les identifiants si demande.
   *
   * @param {string} projectName - Nom du projet pour pre-remplir les noms de base par defaut.
   * @returns {Promise<DatabaseConfig>} Configuration complete de la base de donnees.
   */
  public static async prompt(projectName: string): Promise<DatabaseConfig> {
    const type = (await p.select({
      message: 'Quel moteur de base de donnees souhaitez-vous deployer ?',
      options: [
        {
          value: DatabaseType.POSTGRESQL,
          label: 'PostgreSQL 16 (Recommande avec Prisma et NestJS)',
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
      message: 'Nom de la base de donnees :',
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
      message: 'Generer automatiquement un mot de passe securise a haute entropie (48 hex chars) ?',
      initialValue: true,
    });
    if (p.isCancel(autoGenerate)) process.exit(0);

    let password = '';
    if (autoGenerate) {
      password = CryptoUtils.generateHexPassword(24);
      p.log.info(`Mot de passe genere : ${password.substring(0, 8)}... (sauvegarde dans .env)`);
    } else {
      const customPass = await p.password({
        message: 'Saisissez votre mot de passe de base de donnees :',
        mask: '*',
        validate: (v) => (v.length < 8 ? 'Le mot de passe doit contenir au moins 8 caracteres.' : undefined),
      });
      if (p.isCancel(customPass)) process.exit(0);
      password = customPass as string;
    }

    const port = type === DatabaseType.POSTGRESQL ? 5432 : 3306;

    const autoMigrate = await p.confirm({
      message: 'Executer automatiquement les migrations Prisma / DB au demarrage du conteneur ?',
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
