/**
 * @fileoverview Module de saisie interactive pour les passerelles de SMS (OTP & Alertes clients).
 * @module prompts/sms
 * @author AMBO Tech
 * @license MIT
 */

import * as p from '@clack/prompts';
import { SmsConfig, SmsProviderType } from '../types/config';

/**
 * Assistant interactif pour la configuration des passerelles SMS.
 */
export class SmsPrompt {
  /**
   * Pose les questions nécessaires selon le fournisseur de SMS sélectionné.
   *
   * @param {string} defaultSenderId - Sender ID par défaut suggéré.
   * @returns {Promise<SmsConfig>} Configuration complète de la passerelle SMS.
   */
  public static async prompt(defaultSenderId: string = 'AFD_TEXTILE'): Promise<SmsConfig> {
    const provider = (await p.select({
      message: '📱 Souhaitez-vous configurer l\'envoi de SMS (Codes OTP & alertes) ?',
      options: [
        {
          value: SmsProviderType.DEXCHANGE,
          label: 'Dexchange SMS (Passerelle Sénégal & Zone UEMOA)',
          hint: 'Recommandé pour les livraisons de SMS fiables au Sénégal (Orange, Wave, Free)',
        },
        {
          value: SmsProviderType.TWILIO,
          label: 'Twilio SMS (International)',
          hint: 'Passerelle mondiale via Account SID et Auth Token',
        },
        {
          value: SmsProviderType.DISABLED,
          label: 'Désactiver les SMS (Mode développement ou ultérieur)',
          hint: 'Les codes OTP seront simplement journalisés dans la console',
        },
      ],
    })) as SmsProviderType;

    if (p.isCancel(provider)) process.exit(0);

    if (provider === SmsProviderType.DISABLED) {
      return { provider: SmsProviderType.DISABLED };
    }

    let apiUrl = 'https://api.dexchange-sms.com/v1';
    let apiKey = '';
    let senderId = defaultSenderId;
    let accountSid = '';

    if (provider === SmsProviderType.DEXCHANGE) {
      const url = await p.text({
        message: 'URL d\'API Dexchange SMS :',
        initialValue: 'https://api.dexchange-sms.com/v1',
      });
      if (p.isCancel(url)) process.exit(0);
      apiUrl = url as string;

      const key = await p.password({
        message: 'Clé API Dexchange (API Key) :',
        mask: '•',
        validate: (v) => (!v.trim() ? 'La clé API est requise.' : undefined),
      });
      if (p.isCancel(key)) process.exit(0);
      apiKey = (key as string).trim();

      const sender = await p.text({
        message: 'Nom de l\'expéditeur (Sender ID max 11 caractères, ex: AFD_TEXTILE) :',
        initialValue: defaultSenderId,
        validate: (v) => {
          if (v.length > 11) return 'Le Sender ID ne doit pas dépasser 11 caractères.';
        },
      });
      if (p.isCancel(sender)) process.exit(0);
      senderId = (sender as string).trim();
    } else if (provider === SmsProviderType.TWILIO) {
      const sid = await p.text({
        message: 'Twilio Account SID (AC...) :',
        validate: (v) => (!v.startsWith('AC') ? 'Un Account SID Twilio valide commence par AC.' : undefined),
      });
      if (p.isCancel(sid)) process.exit(0);
      accountSid = (sid as string).trim();

      const token = await p.password({
        message: 'Twilio Auth Token :',
        mask: '•',
      });
      if (p.isCancel(token)) process.exit(0);
      apiKey = (token as string).trim();

      const sender = await p.text({
        message: 'Numéro de téléphone Twilio ou Sender ID vérifié :',
        placeholder: '+1234567890 ou MON_ENTREPRISE',
      });
      if (p.isCancel(sender)) process.exit(0);
      senderId = (sender as string).trim();
    }

    return {
      provider,
      apiUrl,
      apiKey,
      senderId,
      accountSid,
    };
  }
}
