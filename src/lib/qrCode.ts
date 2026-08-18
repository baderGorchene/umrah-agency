import QRCode from "qrcode";

// In-memory cache map for generated QR code data URLs to improve performance
const qrCache = new Map<string, string>();

export interface QRPayload {
  agency: string;
  uniqueCode: string;
  nameArabic: string;
  nameLatin?: string;
  passportNumber?: string;
  birthDate?: string;
  tripName: string;
  makkahHotel?: string;
  madinahHotel?: string;
  emergencyGuide1?: string;
  emergencyGuide2?: string;
  groupLeader?: string;
}

/**
 * Builds a direct public URL for a pilgrim badge without requiring authentication
 */
export function buildBadgePublicUrl(uniqueCode: string): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:3000";
  const basePath = import.meta.env.BASE_URL || "/";
  // Security: Sanitize uniqueCode input by trimming and URL encoding
  const sanitizedCode = encodeURIComponent((uniqueCode || "").trim());
  return `${origin}${basePath}#/badge/${sanitizedCode}`;
}

/**
 * Generates a high-resolution Data URL (PNG image) for a given text or JSON payload.
 * Encodes direct public badge URL so scanning with phone camera opens the badge page directly without login.
 */
export async function generateQRCodeDataUrl(
  textOrPayload: string | QRPayload,
  options: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
    simple?: boolean;
  } = {},
): Promise<string> {
  let content: string;

  if (typeof textOrPayload === "string") {
    const trimmedInput = textOrPayload.trim();
    // Security: Only treat as external absolute URL if strictly starting with http:// or https://
    if (
      trimmedInput.startsWith("http://") ||
      trimmedInput.startsWith("https://")
    ) {
      content = trimmedInput;
    } else if (trimmedInput.startsWith("/")) {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "";
      content = `${origin}${trimmedInput}`;
    } else {
      content = buildBadgePublicUrl(trimmedInput);
    }
  } else {
    content = buildBadgePublicUrl(textOrPayload.uniqueCode);
  }

  // In-memory cache to prevent redundant QR Code generation, improving render performance
  // and eliminating CPU bottlenecks when processing batch badge rendering.
  const width = options.width || 300;
  const margin = options.margin ?? 1;
  const darkColor = options.darkColor || "#000000";
  const lightColor = options.lightColor || "#FFFFFF";
  const cacheKey = `${content}_w${width}_m${margin}_d${darkColor}_l${lightColor}`;

  if (qrCache.has(cacheKey)) {
    return qrCache.get(cacheKey)!;
  }

  try {
    const dataUrl = await QRCode.toDataURL(content, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: "M",
    });
    qrCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error("Failed to generate QR Code:", err);
    return "";
  }
}
