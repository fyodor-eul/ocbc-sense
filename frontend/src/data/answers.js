// Pre-written answers for the simulated assistant. They only use the checked
// text in pages.json ("verified_info") and OCBC's published information.
// When the real /api/explain exists, this file is only used as the fallback.
// The wording itself lives in src/i18n (ans.*, tips.*, chat.refusal).
import { pageInfo } from './content'
import { DOC_TYPES } from './documents'
import { translate } from '../i18n'

const REFUSE_EN = /\b(skip|bypass|fake|cheat|override|hack|get around)\b/i
const REFUSE_OTHER = /(跳过|绕过|越过|伪造|作弊|破解|langkau|pintas|palsu|menipu|godam)/i

// How many pre-written questions each page has.
const COUNTS = {
  'account.step1': 2,
  'account.step2': 2,
  'account.step3': 3,
  'account.step4': 2,
  'account.step5': 3,
  'account.step6': 2,
  'account.submitted': 2,
}

export function refusal(lang = 'en') {
  return translate(lang, 'chat.refusal')
}

// One short hint per step. Shown by the idle timer (Level 1).
export function tipFor(pageId, lang = 'en') {
  const key = `tips.${pageId}`
  const text = translate(lang, key)
  return text === key ? '' : text
}

export function suggestedQuestions(pageId, lang = 'en') {
  return Array.from({ length: COUNTS[pageId] ?? 0 }, (_, i) => translate(lang, `ans.${pageId}.${i}.q`))
}

export function pageVerifiedInfo(pageId, lang = 'en') {
  return pageInfo(pageId, lang)
}

const norm = (t) => t.toLowerCase().replace(/[’‘]/g, "'").trim()

// Mock of POST /api/explain. Returns { answer, fallback } like the real one,
// plus refused: true for requests we must never help with.
// A question typed in English still works when the app is in another language.
export function answerFor(pageId, question, wording = 'standard', lang = 'en') {
  const q = norm(question)
  if (REFUSE_EN.test(q) || REFUSE_OTHER.test(q)) {
    return { answer: refusal(lang), fallback: false, refused: true }
  }

  let best = -1
  let bestScore = 0
  const count = COUNTS[pageId] ?? 0
  for (let i = 0; i < count; i += 1) {
    const base = `ans.${pageId}.${i}.`
    const asked = [translate(lang, `${base}q`), translate('en', `${base}q`)].map(norm)
    if (asked.includes(q)) {
      best = i
      break
    }
    const keys = [...translate(lang, `${base}keys`).split('|'), ...translate('en', `${base}keys`).split('|')]
      .map(norm)
      .filter(Boolean)
    for (const k of keys) {
      if (q.includes(k) && k.length > bestScore) {
        best = i
        bestScore = k.length
      }
    }
  }

  if (best < 0) return { answer: null, fallback: true }

  const list = DOC_TYPES.map((d) => translate(lang, `doc.${d.id}`)).join(lang === 'zh' ? '；' : '; ')
  const key = `ans.${pageId}.${best}.${wording === 'simple' ? 'simple' : 'standard'}`
  return { answer: translate(lang, key, { list }), fallback: false }
}
