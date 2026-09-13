/**
 * @fileoverview Systeme d'affichage et de journalisation pour le terminal.
 * @module utils/logger
 * @author AMBO Tech
 * @license MIT
 */

import chalk from 'chalk';

/**
 * Gestionnaire d'affichage pour formater les messages de la console.
 */
export class Logger {
  /**
   * Affiche la banniere d'accueil officielle de l'outil AMBO Deployer.
   *
   * @returns {void}
   */
  public static banner(): void {
    console.log();
    console.log(chalk.cyan.bold('  +-------------------------------------------------------------+'));
    console.log(chalk.cyan.bold('  |') + chalk.bold.white('                  AMBO TECH - VPS PROVISIONER                ') + chalk.cyan.bold('|'));
    console.log(chalk.cyan.bold('  |') + chalk.gray('         Deploiement Automatise Docker, Nginx et SSL         ') + chalk.cyan.bold('|'));
    console.log(chalk.cyan.bold('  +-------------------------------------------------------------+'));
    console.log();
  }

  /**
   * Affiche un message informatif standard en bleu cyan.
   *
   * @param {string} message - Le message a afficher.
   */
  public static info(message: string): void {
    console.log(chalk.blue('[INFO] ') + chalk.white(message));
  }

  /**
   * Affiche un message de succes en vert.
   *
   * @param {string} message - Le message de succes.
   */
  public static success(message: string): void {
    console.log(chalk.green.bold('[OK] ') + chalk.green(message));
  }

  /**
   * Affiche un avertissement en jaune.
   *
   * @param {string} message - Le message d'avertissement.
   */
  public static warn(message: string): void {
    console.log(chalk.yellow.bold('[WARN] ') + chalk.yellow(message));
  }

  /**
   * Affiche un message d'erreur critique en rouge.
   *
   * @param {string} message - Le message d'erreur.
   * @param {unknown} [error] - Details optionnels de l'erreur ou trace de pile.
   */
  public static error(message: string, error?: unknown): void {
    console.log(chalk.red.bold('[ERROR] ') + chalk.red(message));
    if (error && error instanceof Error) {
      console.log(chalk.gray(`  Detail : ${error.message}`));
      if (error.stack && process.env.DEBUG) {
        console.log(chalk.gray(error.stack));
      }
    } else if (error) {
      console.log(chalk.gray(`  Detail : ${String(error)}`));
    }
  }

  /**
   * Affiche un titre de section avec une ligne de separation.
   *
   * @param {string} title - Le titre de la section.
   */
  public static section(title: string): void {
    console.log();
    console.log(chalk.magenta.bold(`=== ${title} `) + chalk.magenta('='.repeat(Math.max(10, 60 - title.length))));
  }

  /**
   * Affiche une etape numerotee dans le terminal.
   *
   * @param {number} current - Numero de l'etape courante.
   * @param {number} total - Nombre total d'etapes.
   * @param {string} description - Libelle explicatif de l'etape.
   */
  public static step(current: number, total: number, description: string): void {
    console.log(chalk.cyan(`[${current}/${total}] `) + chalk.bold.white(description));
  }
}
