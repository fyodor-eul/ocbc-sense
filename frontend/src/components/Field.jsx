import { TriangleAlert } from 'lucide-react'

export default function Field({ id, label, hint, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">{label}</label>
      {children}
      {hint && !error && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          <TriangleAlert size={16} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  )
}