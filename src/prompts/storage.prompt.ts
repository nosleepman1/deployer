/**
 * @fileoverview Module de saisie interactive pour les fournisseurs de stockage d'objets (S3 / R2).
 * @module prompts/storage
 * @author AMBO Tech
 * @license MIT
 */

import * as p from '@clack/prompts';
import { StorageConfig, StorageProviderType } from '../types/config';

/**
 * Assistant interactif pour la configuration du stockage d'images, documents et fichiers volumineux.
 */
export class StoragePrompt {
  /**
   * Pose les questions necessaires selon le fournisseur de stockage selectionne.
   *
   * @param {string} projectName - Nom du projet pour les prefixes de bucket par defaut.
   * @returns {Promise<StorageConfig>} Configuration complete du stockage d'objets.
   */
  public static async prompt(projectName: string): Promise<StorageConfig> {
    const provider = (await p.select({
      message: 'Quel systeme de stockage d\'objets / medias souhaitez-vous utiliser ?',
      options: [
        {
          value: StorageProviderType.CLOUDFLARE_R2,
          label: 'Cloudflare R2 (Recommande - 0 EUR de frais de bande passante)',
          hint: 'Compatible API S3, rapide et economique',
        },
        {
          value: StorageProviderType.AWS_S3,
          label: 'Amazon Web Services (AWS S3)',
          hint: 'Infrastructure globale Amazon S3',
        },
        {
          value: StorageProviderType.LOCAL,
          label: 'Stockage Local sur le serveur (Docker Volume)',
          hint: 'Aucun compte externe requis, stockage sur le disque du VPS',
        },
      ],
    })) as StorageProviderType;

    if (p.isCancel(provider)) process.exit(0);

    if (provider === StorageProviderType.LOCAL) {
      return { provider: StorageProviderType.LOCAL };
    }

    let endpoint = '';
    let bucketName = '';
    let accessKeyId = '';
    let secretAccessKey = '';
    let publicDomain = '';
    let region = 'auto';

    if (provider === StorageProviderType.CLOUDFLARE_R2) {
      const accountId = await p.text({
        message: 'Cloudflare Account ID (disponible dans votre dashboard Cloudflare) :',
        placeholder: 'a1b2c3d4e5f67890abcdef1234567890',
        validate: (v) => (!v.trim() ? 'L\'Account ID est requis.' : undefined),
      });
      if (p.isCancel(accountId)) process.exit(0);
      endpoint = `https://${(accountId as string).trim()}.r2.cloudflarestorage.com`;

      const bucket = await p.text({
        message: 'Nom du Bucket R2 :',
        initialValue: `${projectName.toLowerCase()}-media`,
      });
      if (p.isCancel(bucket)) process.exit(0);
      bucketName = bucket as string;

      const keyId = await p.text({
        message: 'R2 Access Key ID :',
      });
      if (p.isCancel(keyId)) process.exit(0);
      accessKeyId = (keyId as string).trim();

      const secretKey = await p.password({
        message: 'R2 Secret Access Key :',
        mask: '*',
      });
      if (p.isCancel(secretKey)) process.exit(0);
      secretAccessKey = (secretKey as string).trim();

      const pubDom = await p.text({
        message: 'Nom de domaine public R2 (ou domaine personnalise Cloudflare) :',
        placeholder: `https://media.${projectName.toLowerCase()}.sn`,
        initialValue: `https://media.${projectName.toLowerCase()}.sn`,
      });
      if (p.isCancel(pubDom)) process.exit(0);
      publicDomain = pubDom as string;
    } else if (provider === StorageProviderType.AWS_S3) {
      const reg = await p.text({
        message: 'Region AWS S3 (ex: eu-west-3 pour Paris) :',
        initialValue: 'eu-west-3',
      });
      if (p.isCancel(reg)) process.exit(0);
      region = (reg as string).trim();
      endpoint = `https://s3.${region}.amazonaws.com`;

      const bucket = await p.text({
        message: 'Nom du Bucket AWS S3 :',
        initialValue: `${projectName.toLowerCase()}-media`,
      });
      if (p.isCancel(bucket)) process.exit(0);
      bucketName = bucket as string;

      const keyId = await p.text({
        message: 'AWS Access Key ID :',
      });
      if (p.isCancel(keyId)) process.exit(0);
      accessKeyId = (keyId as string).trim();

      const secretKey = await p.password({
        message: 'AWS Secret Access Key :',
        mask: '*',
      });
      if (p.isCancel(secretKey)) process.exit(0);
      secretAccessKey = (secretKey as string).trim();

      publicDomain = `https://${bucketName}.s3.${region}.amazonaws.com`;
    }

    return {
      provider,
      endpoint,
      bucketName,
      accessKeyId,
      secretAccessKey,
      region,
      publicDomain,
    };
  }
}
