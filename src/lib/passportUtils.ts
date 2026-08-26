/**
 * Utility functions for passport OCR extraction, name cleaning, and formatting.
 */

/**
 * Cleans Tunisian and Arabic passport names formatted as:
 *  - "[First] بن/بنت [Father] [Last]" (e.g. "البشير بن بوراوي القلي" -> "البشير القلي")
 *  - "[First] بنت [Father] [Maiden Last] حرم [Husband Last]" (e.g. "أنوار بنت محمد زقاب حرم سائبي" -> "أنوار زقاب")
 *  - "[First] بنت [Father] [Maiden Last] أرملة [Husband Last]" (e.g. "ساسية بنت علي فحيمة أرملة الدهمـول" -> "ساسية فحيمة")
 *  - "[First] بن [Father] [Last]" (e.g. "بدر بن البشير قرشان" -> "بدر قرشان")
 *
 * Retains strictly the person's first name and actual family name in Arabic.
 */
export function cleanArabicFullName(name?: string): string {
  if (!name) return "";
  let clean = name.trim().replace(/\s+/g, " ");

  // 1. Remove spouse/married/widow name part if present (e.g. "حرم سائبي", "زوجة بن علي", "أرملة الدهمـول", "ارملة الدهمول")
  clean = clean.replace(
    /\s+(?:حرم|زوجة|زوجة\s+المرحوم|أرملة|ارملة|أرملة\s+المرحوم|ارملة\s+المرحوم|مطلقة)\s+.+$/i,
    "",
  ).trim();

  const compoundPrefixes = [
    "عبد",
    "أبو",
    "ابو",
    "بو",
    "سيدي",
    "نور",
    "تقي",
    "سيف",
    "شمس",
    "علاء",
    "ضياء",
    "آل",
    "ال",
  ];

  const words = clean.split(" ");
  if (words.length < 3) return clean;

  // Check if first name is a compound name (e.g. عبد الله or نور الدين)
  let firstPart = words[0];
  let remainingWords = words.slice(1);
  if (compoundPrefixes.includes(words[0]) && words.length >= 4) {
    firstPart = `${words[0]} ${words[1]}`;
    remainingWords = words.slice(2);
  }

  // Find index of بن or بنت or ابن or ابنة in remaining words
  const binIndex = remainingWords.findIndex((w) =>
    ["بن", "بنت", "ابن", "ابنة"].includes(w),
  );

  if (binIndex !== -1 && remainingWords.length >= 2) {
    // Check if the last part is a compound surname (e.g. "بن علي", "بو عزيزي", "عبد اللاوي", "أبو بكر")
    const lastWord = remainingWords[remainingWords.length - 1];
    const prevToLast = remainingWords[remainingWords.length - 2];

    if (
      remainingWords.length >= 4 &&
      ["بن", "بنت", "بو", "أبو", "ابو", "عبد", "آل"].includes(prevToLast)
    ) {
      const lastName = `${prevToLast} ${lastWord}`;
      return `${firstPart} ${lastName}`.trim();
    }
    return `${firstPart} ${lastWord}`.trim();
  }

  // Fallback regex pattern matching
  const binRegex =
    /^(.+?)\s+(?:بن|بنت|ابن|ابنة)\s+(?:.+?\s+)?([^\s]+(?:\s+[^\s]+)?)$/;
  const match = clean.match(binRegex);
  if (match) {
    return `${match[1].trim()} ${match[2].trim()}`.trim();
  }

  return clean;
}

/**
 * Cleans Latin surname by stripping married / widowed spouse mentions:
 *  - "ZGUEB EP SAIBI" -> "ZGUEB"
 *  - "FAHIMA VV DAHMOUL" -> "FAHIMA"
 *  - "BEN ALI EP. TRABELSI" -> "BEN ALI"
 *  - "HAMDI ÉPOUSE GHARBI" -> "HAMDI"
 *  - "GOLLI" -> "GOLLI"
 */
export function cleanLatinSurname(surname?: string): string {
  if (!surname) return "";
  let clean = surname.trim().replace(/\s+/g, " ");

  // Remove "EP", "EP.", "EPOUSE", "ÉPOUSE", "VV", "VV.", "VVE", "VVE.", "VEUVE" and everything following it
  clean = clean.replace(
    /\s+(?:EP\.?|EPOUSE|ÉPOUSE|VV\.?|VVE\.?|VEUVE)\b.*$/i,
    "",
  ).trim();

  return clean;
}

/**
 * Formats full Latin name as "[Surname / Maiden Name] [Given names]":
 *  - Male: "GOLLI" + "BECHIR" -> "GOLLI BECHIR"
 *  - Married Female: "ZGUEB EP SAIBI" + "ANWAR" -> "ZGUEB ANWAR"
 *  - Widowed Female: "FAHIMA VV DAHMOUL" + "SASIA" -> "FAHIMA SASIA"
 *  - Unmarried Female: "TRABELSI" + "MARIEM" -> "TRABELSI MARIEM"
 */
export function formatLatinFullName(
  surname?: string,
  givenNames?: string,
): string {
  const cleanSur = cleanLatinSurname(surname);
  const cleanGiv = (givenNames || "").trim().replace(/\s+/g, " ");

  if (cleanSur && cleanGiv) {
    return `${cleanSur} ${cleanGiv}`.trim();
  }
  return cleanSur || cleanGiv || "—";
}

/**
 * Normalizes date strings to DD/MM/YYYY display format.
 */
export function formatPassportDisplayDate(val?: string): string {
  if (!val) return "—";
  const trimmed = val.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return `${iso[3].padStart(2, "0")}/${iso[2].padStart(2, "0")}/${iso[1]}`;
  }
  const dash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dash) {
    return `${dash[1].padStart(2, "0")}/${dash[2].padStart(2, "0")}/${dash[3]}`;
  }
  return trimmed;
}
