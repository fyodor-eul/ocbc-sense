import { Check } from 'lucide-react'
import './OptionCard.css'
import useT from '../i18n/useT'

export default function OptionCard({ selected, onSelect, tone = 'red', tag = false, children }) {
  const { t } = useT()
  return (
    <button
      type="button"
      className={`option option--${tone} ${selected ? 'option--on' : ''}`.trim()}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="option__body">
        {tag && selected && (
          <span className="option__tag">
            <Check size={14} aria-hidden="true" /> {t('common.selected')}
          </span>
        )}
        {children}
      </span>
      <span className="option__mark" aria-hidden="true">
        {selected && <Check size={14} />}
      </span>
    </button>
  )
}