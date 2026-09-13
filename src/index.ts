/**
 * @fileoverview Point d'entrée principal de l'interface en ligne de commande (CLI) AMBO Deployer.
 * @module index
 * @author AMBO Tech
 * @license MIT
 */

import { Command } from 'commander';
import { InitCommand } from './commands/init.command';
import { DoctorCommand } from './commands/doctor.command';
import { BackupCommand } from './commands/backup.command';
import { RestoreCommand } from './commands/restore.command';
import { RunnerCommand } from './commands/runner.command';

/** Instance principale du programme Commander */
const program = new Command();

program
  .name('deployer')
  .description('🚀 CLI Interactif Universel de Provisioning de VPS et Déploiement Docker (AMBO Tech)')
  .version('1.0.0');

// 1. Commande Init (Parcours Complet)
program
  .command('init')
  .description('Provisionne entièrement un VPS et déploie l\'application de façon interactive')
  .option('-c, --config <path>', 'Chemin vers un fichier de configuration JSON existant')
  .option('-d, --dry-run', 'Simule les commandes système sans les exécuter')
  .action(async (options) => {
    await InitCommand.execute(options);
  });

// 2. Commande Doctor (Diagnostic & Santé)
program
  .command('doctor')
  .description('Audite l\'état de santé du système hôte, de Docker, de la RAM et de Nginx')
  .action(async () => {
    await DoctorCommand.execute();
  });

// 3. Commande Backup (Sauvegarde Immédiate)
program
  .command('backup')
  .description('Déclenche une sauvegarde logique immédiate de la base de données')
  .option('-p, --path <path>', 'Répertoire du projet', '/var/www/afd-textile/backend')
  .action(async (options) => {
    await BackupCommand.execute(options.path);
  });

// 4. Commande Restore (Restauration)
program
  .command('restore <dumpFile>')
  .description('Restaure un fichier de dump .sql.gz dans la base de données PostgreSQL')
  .option('-c, --container <name>', 'Nom du conteneur Docker', 'afd_postgres_prod')
  .option('-d, --db <name>', 'Nom de la base de données', 'afd_textile_prod')
  .option('-u, --user <name>', 'Nom de l\'utilisateur administrateur', 'afd_admin')
  .action(async (dumpFile, options) => {
    await RestoreCommand.execute(dumpFile, options.container, options.db, options.user);
  });

// 5. Commande Runner (GitHub Actions)
program
  .command('runner')
  .description('Installe et connecte un Runner GitHub Actions Self-Hosted sur ce serveur')
  .option('-u, --url <url>', 'URL du dépôt GitHub')
  .option('-t, --token <token>', 'Jeton d\'enregistrement du runner')
  .action(async (options) => {
    await RunnerCommand.execute(options);
  });

// Exécution de l'analyse des arguments
program.parse(process.argv);

// Si aucune commande n'est passée, afficher l'aide
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
