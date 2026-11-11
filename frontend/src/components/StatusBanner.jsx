import { CircleCheck, Info, Lightbulb, TriangleAlert } from 'lucide-react'
import Spinner from './Spinner'
import './StatusBanner.css'

const ICONS = {
  success: CircleCheck,
  error: TriangleAlert,
  caution: TriangleAlert,
  tip: Lightbulb,
  info: Info,
}

export default function StatusBanner({ variant = 'info', label, children }) {
  const Icon = ICONS[variant]
  const role = variant === 'error' ? 'alert' : 'status'
  return (
    <div className={`banner banner--${variant}`} role={role}>
      <span className="banner__icon" aria-hidden="true">
        {variant === 'loading' ? <Spinner /> : <Icon size={22} />}
      </span>
      <div>
        {label && <p className="banner__label">{label}</p>}
        {children && <p className="banner__text">{children}</p>}
      </div>
    </div>
  )
}