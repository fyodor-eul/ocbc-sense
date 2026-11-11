import { translate } from '../i18n'

// OCBC's published list of accepted supporting documents.
// The English label is kept for the data; the screen shows docLabel(id, language).
export const DOC_TYPES = [
  { id: 'offer', label: 'Singapore employment offer letter' },
  { id: 'school', label: 'Singapore school admission letter' },
  { id: 'ica', label: 'ICA In-Principle Approval letter' },
  { id: 'housing', label: 'Utilities or telecom bill, rental agreement or proof of property purchase' },
  { id: 'pass', label: 'Valid Singapore government-issued pass' },
]

export function docLabel(id, lang = 'en') {
  return translate(lang, `doc.${id}`)
}
