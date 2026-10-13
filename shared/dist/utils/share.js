/**
 * STAPLE LIMITED — Sharing & Deep-Linking Utilities (Spec §11)
 * WhatsApp, SMS, and deep-link generation for Nigerian community group buying
 */
import { formatNaira } from './currency.js';
const BASE_WEB_URL = 'https://staple.ng';
/**
 * Build share links and pre-formatted social messages for Nigerian buyers
 */
export function generateGroupBuyShareContent(params) {
    const { slug, itemTitle, unit, areaName, currentPrice, originalPrice, paidQuantity, targetQuantity, hubName, championName, } = params;
    const deepLinkUrl = `${BASE_WEB_URL}/gb/${slug}`;
    // High-reliability SVG QR generator using qrserver API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(deepLinkUrl)}`;
    const discountPercent = originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;
    const savingsText = discountPercent > 0 ? ` (${discountPercent}% OFF bulk price)` : '';
    const organizerText = championName
        ? `Organized by community Champion ${championName}`
        : 'Organized on staple';
    const hubText = hubName
        ? ` Free pickup at official ${hubName}.`
        : '';
    // WhatsApp optimized message (supports emojis & bolding)
    const whatsappMessage = `🛒 *Join my Group Buy on staple!* 🌾\n\n` +
        `We are buying *${itemTitle}* together in *${areaName}* to unlock bulk farmgate pricing!\n\n` +
        `💰 *Price:* ${formatNaira(currentPrice)} / ${unit}${savingsText}\n` +
        `📊 *Progress:* ${paidQuantity}/${targetQuantity} orders filled\n` +
        `📍 *Pickup:*${hubText || ` Hub in ${areaName}`}\n` +
        `⭐ *Organizer:* ${organizerText}\n\n` +
        `👉 Join our community buy here:\n${deepLinkUrl}`;
    // SMS optimized message (concise, no bold markdown)
    const smsMessage = `Join our staple group buy for ${itemTitle} in ${areaName}! Current price: ${formatNaira(currentPrice)}/${unit}. ${paidQuantity}/${targetQuantity} orders placed. Free hub pickup. Join at ${deepLinkUrl}`;
    const shareTitle = `Buy ${itemTitle} together on staple — ${areaName}`;
    return {
        deepLinkUrl,
        qrCodeUrl,
        whatsappMessage,
        smsMessage,
        shareTitle,
    };
}
//# sourceMappingURL=share.js.map