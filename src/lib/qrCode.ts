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
 * Generates a high-resolution Data URL (PNG image) for a given text or JSON payload
 */
export async function generateQRCodeDataUrl(
  textOrPayload: string | QRPayload,
  options: { width?: number; margin?: number; darkColor?: string; lightColor?: string; simple?: boolean } = {}
): Promise<string> {
  let content: string;

  if (typeof textOrPayload === 'string') {
    content = textOrPayload;
  } else if (options.simple) {
    // Simple QR with just the unique code - much less dense
    content = textOrPayload.uniqueCode;
  } else {
    // Full payload for advanced scanning
    content = JSON.stringify({
      app: 'UmrahCompagnon',
      agency: textOrPayload.agency,
      code: textOrPayload.uniqueCode,
      name: textOrPayload.nameArabic,
      latin: textOrPayload.nameLatin || '',
      passport: textOrPayload.passportNumber || '',
      trip: textOrPayload.tripName,
      guide1: textOrPayload.emergencyGuide1 || '',
      guide2: textOrPayload.emergencyGuide2 || '',
    });
  }

  try {
    const dataUrl = await QRCode.toDataURL(content, {
      width: options.width || 300,
      margin: options.margin ?? 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF',
      },
      errorCorrectionLevel: options.simple ? 'L' : 'H',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}
