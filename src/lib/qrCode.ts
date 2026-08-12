import QRCode from 'qrcode';

export interface QRPayload {
  agency: string;
  uniqueCode: string;
  nameArabic: string;
  nameLatin?: string;
  passportNumber?: string;
  tripName: string;
  emergencyGuide1?: string;
  emergencyGuide2?: string;
}

/**
 * Builds a direct public URL for a pilgrim badge without requiring authentication
 */
export function buildBadgePublicUrl(uniqueCode: string): string {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost:3000';
  return `${origin}/badge/${encodeURIComponent(uniqueCode)}`;
}

/**
 * Generates a high-resolution Data URL (PNG image) for a given text or JSON payload.
 * Encodes direct public badge URL so scanning with phone camera opens the badge page directly without login.
 */
export async function generateQRCodeDataUrl(
  textOrPayload: string | QRPayload,
  options: { width?: number; margin?: number; darkColor?: string; lightColor?: string; simple?: boolean } = {}
): Promise<string> {
  let content: string;

  if (typeof textOrPayload === 'string') {
    if (textOrPayload.startsWith('http://') || textOrPayload.startsWith('https://')) {
      content = textOrPayload;
    } else if (textOrPayload.startsWith('/')) {
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
      content = `${origin}${textOrPayload}`;
    } else {
      content = buildBadgePublicUrl(textOrPayload);
    }
  } else {
    content = buildBadgePublicUrl(textOrPayload.uniqueCode);
  }

  try {
    const dataUrl = await QRCode.toDataURL(content, {
      width: options.width || 300,
      margin: options.margin ?? 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}
