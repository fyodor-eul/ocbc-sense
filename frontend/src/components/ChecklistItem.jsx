import { Check } from 'lucide-react'
import './ChecklistItem.css'

export default function ChecklistItem({ icon: Icon, label, note, checked, onToggle }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className="check" onClick={onToggle}>
      <span className="check__icon" aria-hidden="true"><Icon size={22} /></span>
      <span className="check__text">
        <span className="check__label">{label}</span>
        <span className="check__note">{note}</span>
      </span>
      <span className={`check__box ${checked ? 'check__box--on' : ''}`.trim()} aria-hidden="true">
        {checked && <Check size={16} />}
      </span>
    </button>
  )
}
