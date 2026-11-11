const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const fail = (code) => ({ ok: false, code })
const OK = { ok: true }

// These lists feed the hidden presenter panel.
export const NFC_SCENARIOS = [
  { id: 'ok', label: 'Succeeds first time' },
  { id: 'fail-twice', label: 'Fails twice, then succeeds' },
  { id: 'chip-not-found', label: 'Always: chip not found' },
  { id: 'read-failed', label: 'Always: scan stopped' },
  { id: 'not-supported', label: 'Phone has no NFC' },
]
export const ID_SCENARIOS = [
  { id: 'ok', label: 'Succeeds first time' },
  { id: 'unreadable-once', label: 'Unreadable once, then OK' },
  { id: 'always-unreadable', label: 'Always: unreadable' },
]
export const FACE_SCENARIOS = [
  { id: 'ok', label: 'Succeeds first time' },
  { id: 'fail-once', label: 'Fails once, then OK' },
  { id: 'always-fail', label: 'Always: fails' },
]

// "attempt" is 0 on the first try, 1 on the second, and so on.
// Change the wait() numbers below if you want the loading states shorter or longer.
export async function simulateNfcScan(scenario, attempt) {
  if (scenario === 'not-supported') {
    await wait(800)
    return fail('NFC_NOT_SUPPORTED')
  }
  await wait(3000)
  if (scenario === 'chip-not-found') return fail('NFC_CHIP_NOT_FOUND')
  if (scenario === 'read-failed') return fail('NFC_READ_FAILED')
  if (scenario === 'fail-twice') {
    if (attempt === 0) return fail('NFC_CHIP_NOT_FOUND')
    if (attempt === 1) return fail('NFC_READ_FAILED')
  }
  return OK
}

export async function simulateIdPhoto(scenario, attempt) {
  await wait(1500)
  if (scenario === 'always-unreadable') return fail('ID_UNREADABLE')
  if (scenario === 'unreadable-once' && attempt === 0) return fail('ID_UNREADABLE')
  return OK
}

export async function simulateFaceCheck(scenario, attempt) {
  await wait(3000)
  if (scenario === 'always-fail') return fail('VERIFICATION_FAILED')
  if (scenario === 'fail-once' && attempt === 0) return fail('VERIFICATION_FAILED')
  return OK
}
export const DOC_SCENARIOS = [
  { id: 'ok', label: 'Succeeds first time' },
  { id: 'unreadable-once', label: 'Unreadable once, then OK' },
  { id: 'wrong-type-once', label: 'Not accepted once, then OK' },
  { id: 'always-unreadable', label: 'Always: unreadable' },
]

export async function simulateDocumentUpload(scenario, attempt) {
  await wait(2000)
  if (scenario === 'always-unreadable') return fail('DOC_UNREADABLE')
  if (scenario === 'unreadable-once' && attempt === 0) return fail('DOC_UNREADABLE')
  if (scenario === 'wrong-type-once' && attempt === 0) return fail('DOC_WRONG_TYPE')
  return OK
}

// ---- Staff help (simulated until the Socket.IO hand-off is connected)
export const STAFF_SCENARIOS = [
  { id: 'joins', label: 'Staff joins and helps' },
  { id: 'queue', label: 'Stays in the waiting list' },
]

const QUICK_REPLIES = {
  'account.step3': 'Try removing your phone case and scanning again. Hold the phone flat and keep it still until the scan finishes.',
  'account.step4': 'Try again in good light, with all four corners of your ID in view.',
  'account.step5': 'Upload a clearer photo of the document, in good light.',
}
const DEFAULT_REPLY = 'Take your time and try this step again. Tap Ask Sense if you need more help.'

// Plays a fake queue: position 2, then 1, then (if it joins) a message and a resolve.
// Returns a function that stops everything.
export function startStaffSimulation(scenario, pageId, h) {
  const timers = []
  const at = (ms, fn) => timers.push(setTimeout(fn, ms))
  h.onPosition(2)
  at(3000, () => h.onPosition(1))
  if (scenario === 'joins') {
    at(6000, h.onAccepted)
    at(10000, () => h.onMessage(QUICK_REPLIES[pageId] ?? DEFAULT_REPLY))
    at(20000, h.onResolved)
  }
  return () => timers.forEach(clearTimeout)
}
