import en from './en'
import zh from './zh'
import ms from './ms'

const DICTS = { en, zh, ms }
export const LANGUAGE_IDS = ['en', 'zh', 'ms']

const warned = new Set()

// translate('zh', 'step.label', { n: 3, total: 6 })
// Falls back to English, then to the key itself, so a missing string never breaks a page.
export function translate(lang, key, vars) {
  let text = DICTS[lang]?.[key]
  if (text === undefined) {
    text = DICTS.en[key]
    const id = `${lang}:${key}`
    if (import.meta.env?.DEV && !warned.has(id)) {
      warned.add(id)
      console.warn(`[i18n] Missing "${key}" for "${lang}"`)
    }
  }
  if (text === undefined) return key
  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
  }
  return text
}

// Wording-aware lookup. Simple and Standard wording live side by side:
//   "s3.wait"          -> Standard text (also the fallback for Simple)
//   "s3.wait.simple"   -> optional Simple text
//   "s4.id.standard" / "s4.id.simple" -> pairs that have no bare key
// Order: the customer's language first, then English, so a missing Simple
// string in Chinese or Malay never falls back to English Simple.
export function translateWording(lang, wording, key, vars) {
  const order =
    wording === 'simple'
      ? [`${key}.simple`, `${key}.standard`, key]
      : [`${key}.standard`, key]
  for (const code of lang === 'en' ? ['en'] : [lang, 'en']) {
    for (const candidate of order) {
      if (DICTS[code]?.[candidate] !== undefined) return translate(code, candidate, vars)
    }
  }
  return key
}
