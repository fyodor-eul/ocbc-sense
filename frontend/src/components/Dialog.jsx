import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import './Dialog.css'
import useT from '../i18n/useT'

export default function Dialog({ open, onClose, title, className = '', children }) {
  const { t } = useT()
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`.trim()}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="dialog__panel">
        <div className="dialog__handle" aria-hidden="true" />
        <div className="dialog__head">
          <h2 id={titleId} className="dialog__title">{title}</h2>
          <button className="dialog__close" onClick={onClose} aria-label={t('common.close')}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}