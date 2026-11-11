import { translate } from "../i18n";

// Locations based on OCBC's international network list.
// All locations are displayed consistently without implying eligibility.
export const COUNTRIES = [
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "CN", name: "Mainland China" },
  { code: "HK", name: "Hong Kong (HKSAR)" },
];

export function countryName(code, lang = "en") {
  if (!COUNTRIES.some((c) => c.code === code)) return "";
  return translate(lang, `country.${code}`);
}
