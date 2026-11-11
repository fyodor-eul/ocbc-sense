import pages from './pages.json'
import { translate } from '../i18n'

export function getPage(id) {
  return pages.find((p) => p._id === id)
}

// pages.json stays the English source. Other languages come from src/i18n.
function fromDictionary(lang, key, fallback) {
  const text = translate(lang, key)
  return text === key ? fallback : text
}

export function pageText(page, wording, lang = 'en') {
  const mode = wording === 'simple' ? 'simple' : 'standard'
  const fallback = page.text[mode] ?? page.text.standard
  return fromDictionary(lang, `page.${page._id}.${mode}`, fallback)
}

export function pageTitle(id, lang = 'en') {
  return fromDictionary(lang, `page.${id}.title`, getPage(id)?.title ?? '')
}

export function pageInfo(id, lang = 'en') {
  return fromDictionary(lang, `page.${id}.info`, getPage(id)?.verified_info ?? '')
}
