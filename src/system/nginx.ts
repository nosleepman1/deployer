/**
 * @fileoverview Gestionnaire de configuration du Reverse Proxy Nginx.
 * @module system/nginx
 * @author AMBO Tech
 * @license MIT
 */

import * as fs from 'fs';
import * as path from 'path';
import { Shell } from '../utils/shell';
import { Logger } from '../utils/logger';
import { NginxGenerator } from '../generators/nginx.generator';
import { DomainConfig } from '../types/config';

/**
 * Gestionnaire pour l'installation de Nginx, la création des VirtualHosts et le rechargement du service.
 */
export class NginxManager {
  /**
   * Installe Nginx et Certbot si absents du système hôte.
   *
   * @returns {Promise<boolean>} True si les paquets sont installés.
   */
  public static async installNginx(): Promise<boolean> {
    const hasNginx = await Shell.hasCommand('nginx');
    if (hasNginx) {
      Logger.info('Nginx est déjà installé sur le système.');
      return true;
    }

    Logger.info('Installation de Nginx et Certbot...');
    const res = await Shell.run('sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx');
    return res.success;
  }

  /**
   * Génère et active la configuration de site Nginx pour le domaine spécifié.
   *
   * @param {string} projectName - Nom du projet pour identifier le fichier de configuration.
   * @param {DomainConfig} domain - Paramètres du nom de domaine et du port d'écoute interne.
   * @returns {Promise<boolean>} True si la configuration est valide et Nginx rechargé.
   */
  public static async configureSite(projectName: string, domain: DomainConfig): Promise<boolean> {
    await this.installNginx();

    const siteConfigContent = NginxGenerator.generateConfig(domain);
    const siteName = `${projectName.toLowerCase()}.conf`;
    const tempPath = `/tmp/${siteName}`;
    const sitesAvailablePath = `/etc/nginx/sites-available/${siteName}`;
    const sitesEnabledPath = `/etc/nginx/sites-enabled/${siteName}`;

    Logger.info(`Configuration du VirtualHost Nginx pour ${domain.domainName}...`);

    try {
      // 1. Écriture du fichier temporaire puis déplacement avec sudo
      fs.writeFileSync(tempPath, siteConfigContent, 'utf-8');
      await Shell.run(`sudo mv ${tempPath} ${sitesAvailablePath}`);
      await Shell.run(`sudo chmod 644 ${sitesAvailablePath}`);

      // 2. Création du lien symbolique vers sites-enabled
      await Shell.run(`sudo ln -sf ${sitesAvailablePath} ${sitesEnabledPath}`);

      // 3. Suppression du site par défaut s'il existe
      await Shell.run('sudo rm -f /etc/nginx/sites-enabled/default');

      // 4. Test de la syntaxe Nginx
      const testRes = await Shell.run('sudo nginx -t');
      if (!testRes.success) {
        Logger.error('Erreur de syntaxe dans la configuration Nginx :', testRes.stderr);
        return false;
      }

      // 5. Rechargement gracieux
      await Shell.run('sudo systemctl reload nginx');
      Logger.success(`VirtualHost Nginx activé pour ${domain.domainName}.`);
      return true;
    } catch (err: any) {
      Logger.error('Impossible de créer la configuration Nginx :', err);
      return false;
    }
  }
}
