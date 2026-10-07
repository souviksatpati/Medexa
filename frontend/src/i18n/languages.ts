export type LanguageCode =
  | "en"
  | "hi"
  | "bn"
  | "ta"
  | "te"
  | "mr"
  | "gu"
  | "kn"
  | "ml"
  | "or"
  | "pa"
  | "as";

export interface LanguageInfo {
  code: LanguageCode;
  name: string;          // English name
  nativeName: string;    // Native script name
  shortCode: string;     // 2-letter uppercase label for mobile (EN, HI, BN, etc.)
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", shortCode: "EN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", shortCode: "HI" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", shortCode: "BN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", shortCode: "TA" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", shortCode: "TE" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", shortCode: "MR" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", shortCode: "GU" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", shortCode: "KN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", shortCode: "ML" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", shortCode: "OR" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", shortCode: "PA" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", shortCode: "AS" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";
