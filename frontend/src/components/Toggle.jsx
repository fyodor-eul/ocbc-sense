import './Toggle.css'

export default function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="toggle"
      onClick={() => onChange(!checked)}
    >
      <span className={`toggle__track ${checked ? 'toggle__track--on' : ''}`.trim()}>
        <span className="toggle__knob" />
      </span>
    </button>
  )
}