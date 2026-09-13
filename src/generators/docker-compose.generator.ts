/**
 * @fileoverview Générateur et validateur de configuration Docker Compose de production.
 * @module generators/docker-compose
 * @author AMBO Tech
 * @license MIT
 */

import { DeploymentConfig } from '../types/config';

/**
 * Générateur de fichiers `docker-compose.prod.yml` complets et résilients.
 */
export class DockerComposeGenerator {
  /**
   * Génère la définition YAML complète des services de production (Postgres + Backend).
   *
   * @param {DeploymentConfig} config - Configuration du projet.
   * @returns {string} Contenu YAML formaté du fichier Docker Compose.
   */
  public static generate(config: DeploymentConfig): string {
    const projectSlug = config.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    return `version: '3.8'

# ==============================================================================
# Stack Docker Production — ${config.projectName.toUpperCase()}
# Généré automatiquement par AMBO Tech Deployer
# ==============================================================================

services:
  # Base de données PostgreSQL avec volume persistant
  postgres:
    image: postgres:16-alpine
    container_name: afd_postgres_prod
    restart: always
    environment:
      POSTGRES_USER: \${DATABASE_USER}
      POSTGRES_PASSWORD: \${DATABASE_PASSWORD}
      POSTGRES_DB: \${DATABASE_NAME}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DATABASE_USER} -d \${DATABASE_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - ${projectSlug}_internal_network

  # Application Backend (NestJS / Node.js)
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: afd_backend_prod
    restart: always
    ports:
      - "127.0.0.1:${config.domain.appPort}:${config.domain.appPort}"
    env_file:
      - .env
    environment:
      NODE_ENV: ${config.environment}
      PORT: ${config.domain.appPort}
      DATABASE_URL: postgresql://\${DATABASE_USER}:\${DATABASE_PASSWORD}@postgres:5432/\${DATABASE_NAME}?schema=public
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:${config.domain.appPort}/api/v1/health || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - ${projectSlug}_internal_network

volumes:
  postgres_data:
    driver: local

networks:
  ${projectSlug}_internal_network:
    driver: bridge
`;
  }
}
