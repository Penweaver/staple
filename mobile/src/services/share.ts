/**
 * STAPLE LIMITED — Mobile Social Sharing Service (Spec §11)
 * Native share sheets, WhatsApp direct linking, and QR code modal triggers
 */

import { Share, Linking, Alert } from 'react-native';
import { generateGroupBuyShareContent, GenerateShareContentParams } from '@staple/shared';

/**
 * Open native share sheet for a Group Buy
 */
export async function shareGroupBuy(params: GenerateShareContentParams): Promise<boolean> {
  const content = generateGroupBuyShareContent(params);

  try {
    const result = await Share.share({
      title: content.shareTitle,
      message: content.whatsappMessage,
      url: content.deepLinkUrl, // iOS uses url field
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Error sharing Group Buy:', error);
    Alert.alert('Share Failed', 'Unable to open share sheet. Please copy the link manually.');
    return false;
  }
}

/**
 * Directly open WhatsApp with pre-filled message (heavily used in Nigeria)
 */
export async function shareToWhatsApp(params: GenerateShareContentParams): Promise<boolean> {
  const content = generateGroupBuyShareContent(params);
  const encodedText = encodeURIComponent(content.whatsappMessage);
  const whatsappUrl = `whatsapp://send?text=${encodedText}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return true;
    } else {
      // Fallback to web WhatsApp or generic share
      const webWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
      await Linking.openURL(webWhatsAppUrl);
      return true;
    }
  } catch (error) {
    // Fall back to native share
    return await shareGroupBuy(params);
  }
}
