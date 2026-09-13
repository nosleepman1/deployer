/**
 * @fileoverview Système d'affichage et de journalisation élégant pour le terminal.
 * @module utils/logger
 * @author AMBO Tech
 * @license MIT
 */

import chalk from 'chalk';

/**
 * Gestionnaire d'affichage pour formater les messages de la console avec des couleurs et des icônes.
 */
export class Logger {
  /**
   * Affiche la bannière d'accueil officielle de l'outil AMBO Deployer.
   *
   * @returns {void}
   */
  public static banner(): void {
    console.log();
    console.log(chalk.cyan.bold('  ┌─────────────────────────────────────────────────────────────┐'));
    console.log(chalk.cyan.bold('  │') + chalk.bold.white('               🚀 AMBO TECH — VPS PROVISIONER                ') + chalk.cyan.bold('│'));
    console.log(chalk.cyan.bold('  │') + chalk.gray('         Déploiement Automatisé Docker, Nginx & SSL          ') + chalk.cyan.bold('│'));
    console.log(chalk.cyan.bold('  └─────────────────────────────────────────────────────────────┘'));
    console.log();
  }

  /**
   * Affiche un message informatif standard en bleu cyan.
   *
   * @param {string} message - Le message à afficher.
   */
  public static info(message: string): void {
    console.log(chalk.blue('ℹ ') + chalk.white(message));
  }

  /**
   * Affiche un message de succès en vert vif.
   *
   * @param {string} message - Le message de succès.
   */
  public static success(message: string): void {
    console.log(chalk.green.bold('✔ ') + chalk.green(message));
  }

  /**
   * Affiche un avertissement en jaune orangé.
   *
   * @param {string} message - Le message d'avertissement.
   */
  public static warn(message: string): void {
    console.log(chalk.yellow.bold('⚠ ') + chalk.yellow(message));
  }

  /**
   * Affiche un message d'erreur critique en rouge.
   *
   * @param {string} message - Le message d'erreur.
   * @param {unknown} [error] - Détails optionnels de l'erreur ou trace de pile.
   */
  public static error(message: string, error?: unknown): void {
    console.log(chalk.red.bold('✖ ') + chalk.red(message));
    if (error && error instanceof Error) {
      console.log(chalk.gray(`  Détail : ${error.message}`));
      if (error.stack && process.env.DEBUG) {
        console.log(chalk.gray(error.stack));
      }
    } else if (error) {
      console.log(chalk.gray(`  Détail : ${String(error)}`));
    }
  }

  /**
   * Affiche un titre de section avec une ligne de séparation esthétique.
   *
   * @param {string} title - Le titre de la section.
   */
  public static section(title: string): void {
    console.log();
    console.log(chalk.magenta.bold(`═══ ${title} `) + chalk.magenta('═'.repeat(Math.max(10, 60 - title.length))));
  }

  /**
   * Affiche une étape numérotée dans le terminal.
   *
   * @param {number} current - Numéro de l'étape courante.
   * @param {number} total - Nombre total d'étapes.
   * @param {string} description - Libellé explicatif de l'étape.
   */
  public static step(current: number, total: number, description: string): void {
    console.log(chalk.cyan(`[${current}/${total}] `) + chalk.bold.white(description));
  }
}
