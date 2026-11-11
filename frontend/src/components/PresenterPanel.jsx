import { usePresenter } from '../context/PresenterContext'
import { DOC_SCENARIOS, FACE_SCENARIOS, ID_SCENARIOS, NFC_SCENARIOS } from '../api/simulate'
import './PresenterPanel.css'

function Picker({ label, value, options, onChange }) {
  return (
    <label className="presenter__row">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

export default function PresenterPanel() {
  const { enabled, scenarios, setScenario } = usePresenter()
  if (!enabled) return null

  function restart() {
    try {
      localStorage.removeItem('ocbcsense.prefs')
      sessionStorage.removeItem('ocbcsense.session')
      sessionStorage.removeItem('ocbcsense.reference')
    } catch {
      /* ignore */
    }
    window.location.assign('/?presenter=1')
  }

  return (
    <details className="presenter">
      <summary>Presenter</summary>
      <div className="presenter__panel">
        <Picker label="Passport scan" value={scenarios.nfc} options={NFC_SCENARIOS} onChange={(v) => setScenario('nfc', v)} />
        <Picker label="ID photo" value={scenarios.id} options={ID_SCENARIOS} onChange={(v) => setScenario('id', v)} />
        <Picker label="Face check" value={scenarios.face} options={FACE_SCENARIOS} onChange={(v) => setScenario('face', v)} />
        <Picker label="Document upload" value={scenarios.doc} options={DOC_SCENARIOS} onChange={(v) => setScenario('doc', v)} />
        <button type="button" onClick={restart}>Restart demo</button>
      </div>
    </details>
  )
}