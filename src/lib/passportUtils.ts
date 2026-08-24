/**
 * Utility functions for passport OCR extraction and formatting.
 */

/**
 * Cleans Tunisian and Arabic passport names formatted as "[First] بن/بنت [Father] [Last]"
 * to extract and retain strictly the first name and family name in Arabic.
 *
 * Example:
 *  - "بدر بن البشير قرشان" -> "بدر قرشان"
 *  - "مريم بنت محمد الطرابلسي" -> "مريم الطرابلسي"
 *  - "محمد بن علي بن سالم القروي" -> "محمد القروي"
 *  - "عبد الله بن محمد الورغي" -> "عبد الله الورغي"
 *  - "هند بنت الشاذلي بو عزيزي" -> "هند بو عزيزي"
 */
export function cleanArabicFullName(name?: string): string {
  if (!name) return "";
  const clean = name.trim().replace(/\s+/g, " ");

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
