/**
 * @fileoverview Module de saisie interactive et de configuration pour les fournisseurs d'emails.
 * @module prompts/email
 * @author AMBO Tech
 * @license MIT
 */

import * as p from '@clack/prompts';
import { EmailConfig, EmailProviderType } from '../types/config';

/**
 * Assistant interactif guidé pour la configuration du service d'emails et SMTP.
 */
export class EmailPrompt {
  /**
   * Pose les questions nécessaires selon le fournisseur d'email sélectionné.
   *
   * @param {string} defaultFrom - Adresse d'expédition par défaut suggérée.
   * @returns {Promise<EmailConfig>} Configuration complète du service d'emails.
   */
  public static async prompt(defaultFrom: string = 'noreply@example.com'): Promise<EmailConfig> {
    const provider = (await p.select({
      message: '📧 Quel service d\'envoi d\'emails (SMTP) souhaitez-vous utiliser ?',
      options: [
        {
          value: EmailProviderType.GOOGLE,
          label: 'Google Workspace / Gmail (Recommandé)',
          hint: 'Utilise le SMTP Google sécurisé avec mot de passe d\'application 16 caractères',
        },
        {
          value: EmailProviderType.OVH,
          label: 'OVH Mail / Pro',
          hint: 'Serveur mutualisé ou dédié OVH Telecom (ssl0.ovh.net)',
        },
        {
          value: EmailProviderType.BREVO,
          label: 'Brevo (ex-Sendinblue)',
          hint: 'Plateforme transactionnelle via SMTP/API Brevo',
        },
        {
          value: EmailProviderType.RESEND,
          label: 'Resend',
          hint: 'Service moderne d\'emails pour développeurs',
        },
        {
          value: EmailProviderType.CUSTOM_SMTP,
          label: 'Autre serveur SMTP personnalisé',
          hint: 'Saisie manuelle des hôtes, ports et identifiants',
        },
        {
          value: EmailProviderType.DISABLED,
          label: 'Désactiver les emails pour le moment',
          hint: 'Aucun envoi de notification par email',
        },
      ],
    })) as EmailProviderType;

    if (p.isCancel(provider)) {
      p.cancel('Opération annulée par l\'utilisateur.');
      process.exit(0);
    }

    if (provider === EmailProviderType.DISABLED) {
      return { provider: EmailProviderType.DISABLED };
    }

    let smtpHost = '';
    let smtpPort = 587;
    let smtpUser = '';
    let smtpPassword = '';

    if (provider === EmailProviderType.GOOGLE) {
      p.note(
        'Pour Gmail / Google Workspace :\n' +
        '1. Rendez-vous sur votre compte Google > Sécurité > Validation en deux étapes.\n' +
        '2. Tout en bas, créez un "Mot de passe d\'application" (16 lettres).\n' +
        '3. Ne saisissez JAMAIS votre mot de passe personnel Gmail classique.',
        'ℹ Instructions Google App Password'
      );

      smtpHost = 'smtp.gmail.com';
      smtpPort = 587;

      const user = await p.text({
        message: 'Adresse email Google / Gmail :',
        placeholder: 'direction@votre-domaine.com ou votre-compte@gmail.com',
        validate: (value) => {
          if (!value.includes('@')) return 'Veuillez saisir une adresse email valide.';
        },
      });
      if (p.isCancel(user)) process.exit(0);
      smtpUser = user as string;

      const pass = await p.password({
        message: 'Mot de passe d\'application Google (16 caractères) :',
        mask: '•',
        validate: (value) => {
          if (value.trim().length === 0) return 'Le mot de passe d\'application est requis.';
        },
      });
      if (p.isCancel(pass)) process.exit(0);
      smtpPassword = pass as string;
    } else if (provider === EmailProviderType.OVH) {
      smtpHost = 'ssl0.ovh.net';
      smtpPort = 587;

      const user = await p.text({
        message: 'Adresse email du compte OVH :',
        placeholder: 'contact@votre-domaine.com',
      });
      if (p.isCancel(user)) process.exit(0);
      smtpUser = user as string;

      const pass = await p.password({
        message: 'Mot de passe du compte OVH :',
        mask: '•',
      });
      if (p.isCancel(pass)) process.exit(0);
      smtpPassword = pass as string;
    } else if (provider === EmailProviderType.BREVO) {
      smtpHost = 'smtp-relay.brevo.com';
      smtpPort = 587;

      const user = await p.text({
        message: 'Identifiant de connexion Brevo (Login SMTP) :',
        placeholder: 'votre-login-smtp@smtp-brevo.com',
      });
      if (p.isCancel(user)) process.exit(0);
      smtpUser = user as string;

      const pass = await p.password({
        message: 'Clé d\'API principale ou Mot de passe SMTP Brevo (Master Key) :',
        mask: '•',
      });
      if (p.isCancel(pass)) process.exit(0);
      smtpPassword = pass as string;
    } else if (provider === EmailProviderType.RESEND) {
      smtpHost = 'smtp.resend.com';
      smtpPort = 465;
      smtpUser = 'resend';

      const pass = await p.password({
        message: 'Clé d\'API Resend (re_...) :',
        mask: '•',
      });
      if (p.isCancel(pass)) process.exit(0);
      smtpPassword = pass as string;
    } else if (provider === EmailProviderType.CUSTOM_SMTP) {
      const host = await p.text({
        message: 'Hôte du serveur SMTP :',
        placeholder: 'mail.mondomaine.com',
      });
      if (p.isCancel(host)) process.exit(0);
      smtpHost = host as string;

      const port = await p.text({
        message: 'Port SMTP :',
        initialValue: '587',
      });
      if (p.isCancel(port)) process.exit(0);
      smtpPort = parseInt(port as string, 10) || 587;

      const user = await p.text({
        message: 'Nom d\'utilisateur SMTP :',
        placeholder: 'user@mondomaine.com',
      });
      if (p.isCancel(user)) process.exit(0);
      smtpUser = user as string;

      const pass = await p.password({
        message: 'Mot de passe SMTP :',
        mask: '•',
      });
      if (p.isCancel(pass)) process.exit(0);
      smtpPassword = pass as string;
    }

    const from = await p.text({
      message: 'Nom et adresse d\'expédition affichés (Header From) :',
      initialValue: defaultFrom,
      placeholder: '"Mon Application" <contact@mondomaine.com>',
    });
    if (p.isCancel(from)) process.exit(0);

    const ownerEmail = await p.text({
      message: 'Adresse email de l\'administrateur recevant les alertes système :',
      initialValue: smtpUser || 'admin@votre-domaine.com',
    });
    if (p.isCancel(ownerEmail)) process.exit(0);

    return {
      provider,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpFrom: from as string,
      ownerNotificationEmail: ownerEmail as string,
    };
  }
}
