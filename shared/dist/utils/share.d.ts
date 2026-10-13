/**
 * STAPLE LIMITED — Sharing & Deep-Linking Utilities (Spec §11)
 * WhatsApp, SMS, and deep-link generation for Nigerian community group buying
 */
export interface GenerateShareContentParams {
    slug: string;
    itemTitle: string;
    unit: string;
    areaName: string;
    currentPrice: number;
    originalPrice: number;
    paidQuantity: number;
    targetQuantity: number;
    hubName?: string | null;
    championName?: string | null;
}
export interface ShareContentResult {
    deepLinkUrl: string;
    qrCodeUrl: string;
    whatsappMessage: string;
    smsMessage: string;
    shareTitle: string;
}
/**
 * Build share links and pre-formatted social messages for Nigerian buyers
 */
export declare function generateGroupBuyShareContent(params: GenerateShareContentParams): ShareContentResult;
//# sourceMappingURL=share.d.ts.map