/**
 * @fileoverview Point d'entree principal de l'interface en ligne de commande (CLI) AMBO Deployer.
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
  .description('CLI Interactif Universel de Provisioning de VPS et Deploiement Docker (AMBO Tech)')
  .version('1.0.0');

// 1. Commande Init (Parcours Complet)
program
  .command('init')
  .description('Provisionne entierement un VPS et deploie l\'application de facon interactive')
  .option('-c, --config <path>', 'Chemin vers un fichier de configuration JSON existant')
  .option('-d, --dry-run', 'Simule les commandes systeme sans les executer')
  .action(async (options) => {
    await InitCommand.execute(options);
  });

// 2. Commande Doctor (Diagnostic & Sante)
program
  .command('doctor')
  .description('Audite l\'etat de sante du systeme hote, de Docker, de la RAM et de Nginx')
  .action(async () => {
    await DoctorCommand.execute();
  });

// 3. Commande Backup (Sauvegarde Immediate)
program
  .command('backup')
  .description('Declenche une sauvegarde logique immediate de la base de donnees')
  .option('-p, --path <path>', 'Repertoire du projet', '/var/www/afd-textile/backend')
  .action(async (options) => {
    await BackupCommand.execute(options.path);
  });

// 4. Commande Restore (Restauration)
program
  .command('restore <dumpFile>')
  .description('Restaure un fichier de dump .sql.gz dans la base de donnees PostgreSQL')
  .option('-c, --container <name>', 'Nom du conteneur Docker', 'afd_postgres_prod')
  .option('-d, --db <name>', 'Nom de la base de donnees', 'afd_textile_prod')
  .option('-u, --user <name>', 'Nom de l\'utilisateur administrateur', 'afd_admin')
  .action(async (dumpFile, options) => {
    await RestoreCommand.execute(dumpFile, options.container, options.db, options.user);
  });

// 5. Commande Runner (GitHub Actions)
program
  .command('runner')
  .description('Installe et connecte un Runner GitHub Actions Self-Hosted sur ce serveur')
  .option('-u, --url <url>', 'URL du depot GitHub')
  .option('-t, --token <token>', 'Jeton d\'enregistrement du runner')
  .action(async (options) => {
    await RunnerCommand.execute(options);
  });

// Execution de l'analyse des arguments
program.parse(process.argv);

// Si aucune commande n'est passee, afficher l'aide
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
