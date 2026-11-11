import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const KEY = 'ocbcsense.presenter'
const DEFAULT_SCENARIOS = { nfc: 'ok', id: 'ok', face: 'ok', doc: 'ok', staff: 'joins' }

// The panel only appears if the page was opened with ?presenter=1
function readEnabled() {
  try {
    if (new URLSearchParams(window.location.search).get('presenter') === '1') {
      sessionStorage.setItem(KEY, '1')
    }
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

const PresenterContext = createContext({
  enabled: false,
  scenarios: DEFAULT_SCENARIOS,
  setScenario: () => {},
})

export function PresenterProvider({ children }) {
  const [enabled] = useState(readEnabled)
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS)
  const setScenario = useCallback((key, value) => setScenarios((s) => ({ ...s, [key]: value })), [])
  const value = useMemo(() => ({ enabled, scenarios, setScenario }), [enabled, scenarios, setScenario])
  return <PresenterContext.Provider value={value}>{children}</PresenterContext.Provider>
}

export function usePresenter() {
  return useContext(PresenterContext)
}