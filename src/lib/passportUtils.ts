/**
 * Utility functions for passport OCR extraction, regex-based name parsing, and formatting.
 * Handles Tunisian passports for males and females (single, married, widowed).
 */

/**
 * Checks if a token matches filiation markers (بن / بنت / ابن / ابنة / إبن / إبنة)
 * with fuzzy OCR fault-tolerance.
 */
function isFiliationWord(w: string): boolean {
  if (!w) return false;
  const normalized = w.replace(/ـ/g, "").replace(/[^\u0621-\u064A]/g, "");
  // Matches: بن, بنت, ابن, ابنة, إبن, إبنة, بنة, بـن, بـنت, بثت, بئت, etc.
  return /^(?:[اأإآ]?بن|[اأإآ]?بنت|[اأإآ]?بنة|[اأإآ]?ابن|[اأإآ]?ابنة|ب[نثئ][تة]?)$/.test(
    normalized,
  );
}

/**
 * Checks if a token matches spouse / widow / divorce markers (حرم / زوجة / أرملة / مطلقة)
 * with fuzzy OCR fault-tolerance.
 */
function isSpouseOrWidowWord(w: string): boolean {
  if (!w) return false;
  const normalized = w.replace(/ـ/g, "").replace(/[^\u0621-\u064A]/g, "");
  // Matches: حرم, حرمة, حرمه, زوجة, زوجه, أرملة, ارملة, ارمله, أرمله, مطلقة, مطلقه
  return /^(?:حرم[ةه]?|حـرم[ةه]?|زو[جح][ةه]?|[اأإآ]رمل[ةه]?|مطلق[ةه]?)$/.test(
    normalized,
  );
}

/**
 * Robust Regex & Token-based parser for Arabic passport names:
 *  - Male: "[الاسم] بن [اسم الأب] [اللقب]" -> "[الاسم] [اللقب]" (e.g. "البشير بن بوراوي القلي" -> "البشير القلي")
 *  - Married Female: "[الاسم] بنت [اسم الأب] [اللقب الأصلي] حرم [لقب الزوج]" -> "[الاسم] [اللقب الأصلي]" (e.g. "أنوار بنت محمد زقاب حرم سائبي" -> "أنوار زقاب")
 *  - Widowed Female: "[الاسم] بنت [اسم الأب] [اللقب الأصلي] أرملة [لقب الزوج]" -> "[الاسم] [اللقب الأصلي]" (e.g. "ساسية بنت علي فحيمة أرملة الدهمـول" -> "ساسية فحيمة")
 *  - Compound Surnames: "[الاسم] بن [اسم الأب] بن علي" -> "[الاسم] بن علي"
 */
export function cleanArabicFullName(rawName?: string): string {
  if (!rawName) return "";
  let clean = rawName.trim().replace(/\s+/g, " ");

  // 1. Remove tatweel / kashida (ـ)
  clean = clean.replace(/ـ/g, "");

  // 2. Remove punctuation / noise introduced by OCR
  clean = clean
    .replace(/[.:,;/\\|_\-\[\]{}()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 3. Tokenize
  let tokens = clean.split(" ").filter(Boolean);
  if (tokens.length === 0) return "";

  // 4. Strip spouse / widow segment (e.g. "أرملة الدهمول", "حرم سائبي", "زوجة بن سالم")
  const spouseIdx = tokens.findIndex(isSpouseOrWidowWord);
  if (spouseIdx !== -1) {
    tokens = tokens.slice(0, spouseIdx);
  }

  if (tokens.length === 0) return "";

  // 5. Detect filiation marker (بن / بنت / ابن / ابنة / إبن / إبنة)
  const filiationIdx = tokens.findIndex(isFiliationWord);

  if (filiationIdx > 0 && filiationIdx < tokens.length - 1) {
    // First name is all tokens before filiation
    const firstNameTokens = tokens.slice(0, filiationIdx);
    const firstName = firstNameTokens.join(" ");

    // Tokens after filiation (Father's name + Actual Family name)
    const afterTokens = tokens.slice(filiationIdx + 1);

    if (afterTokens.length === 1) {
      return `${firstName} ${afterTokens[0]}`.trim();
    }

    // Check for compound surname (e.g. "بن علي", "بو عزيزي", "عبد اللاوي", "أبو بكر", "آل ...")
    const lastWord = afterTokens[afterTokens.length - 1];
    const prevWord = afterTokens[afterTokens.length - 2];

    if (
      afterTokens.length >= 3 &&
      ["بن", "بنت", "بو", "أبو", "ابو", "عبد", "آل"].includes(prevWord)
    ) {
      return `${firstName} ${prevWord} ${lastWord}`.trim();
    }

    // Standard case: last word is the family name
    return `${firstName} ${lastWord}`.trim();
  }

  // If no filiation token was found, return cleaned name
  return tokens.join(" ");
}

/**
 * Regex-based cleaner for Latin surnames on Tunisian passports:
 *  - Strips married stop words: "EP", "EP.", "EPOUSE", "ÉPOUSE", "E/P"
 *  - Strips widow stop words: "VV", "VV.", "VVE", "VVE.", "VEUVE", "V/V"
 *
 * Examples:
 *  - "FAHIMA VV DAHMOUL" -> "FAHIMA"
 *  - "ZGUEB EP SAIBI" -> "ZGUEB"
 *  - "BEN ALI EP. TRABELSI" -> "BEN ALI"
 *  - "GOLLI" -> "GOLLI"
 */
export function cleanLatinSurname(surname?: string): string {
  if (!surname) return "";
  let clean = surname.trim().replace(/\s+/g, " ");

  // Strip stop words: EP, EP., EPOUSE, ÉPOUSE, VV, VV., VVE, VVE., VEUVE, E/P, V/V, W/O and everything after
  const latinStopRegex =
    /(?:^|\s+|[\/_,.-])(?:EP\.?|EPOUSE|ÉPOUSE|VV\.?|VVE\.?|VEUVE|E\/P|V\/V|W\/O)\b.*$/i;
  clean = clean.replace(latinStopRegex, "").trim();

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
