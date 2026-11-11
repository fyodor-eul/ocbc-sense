import { translate } from '../i18n'

// Plain-language names for error codes, shown to the customer in the share summary.
export function errorLabel(code, lang = 'en') {
  const key = `err.${code}`
  const text = translate(lang, key)
  return text === key ? code : text
}
