/**
 * @fileoverview Générateur de configurations de VirtualHost pour Nginx Reverse Proxy.
 * @module generators/nginx
 * @author AMBO Tech
 * @license MIT
 */

import { DomainConfig } from '../types/config';

/**
 * Générateur de gabarits Nginx optimisés pour les API NestJS/Node.js et WebSockets.
 */
export class NginxGenerator {
  /**
   * Génère le bloc de configuration de serveur Nginx complet.
   *
   * @param {DomainConfig} domain - Paramètres du domaine et du port interne de l'application.
   * @returns {string} Fichier de configuration Nginx formaté.
   */
  public static generateConfig(domain: DomainConfig): string {
    return `# ==============================================================================
# Configuration Nginx Reverse Proxy — ${domain.domainName}
# Généré automatiquement par AMBO Tech Deployer
# ==============================================================================

server {
    listen 80;
    listen [::]:80;
    server_name ${domain.domainName};

    # Limite de taille pour l'upload de médias et documents (25 Mo)
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:${domain.appPort};
        proxy_http_version 1.1;

        # Support des connexions persistantes et WebSockets
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Transmission des adresses IP clientes réelles
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Délais d'attente allongés pour les traitements lourds (génération PDF, exports)
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }

    # Sécurisation des fichiers cachés
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
`;
  }
}
