import { ChevronRight, Headset, Info, Bot } from 'lucide-react'
import Button from '../components/Button'
import useT from '../i18n/useT'

export default function MenuSheet({ canStaff, onChat, onStaff, onClose }) {
  const { t } = useT()
  return (
    <div className="sheet">
      <button className="sheet__row" onClick={onChat}>
        <span className="sheet__icon sheet__icon--red" aria-hidden="true"><Bot size={22} /></span>
        <span className="sheet__text">
          <span className="sheet__title">{t('menu.chat')}</span>
          <span className="sheet__sub">{t('menu.chat.sub')}</span>
        </span>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
      <button className="sheet__row" onClick={onStaff} disabled={!canStaff}>
        <span className="sheet__icon sheet__icon--green" aria-hidden="true"><Headset size={22} /></span>
        <span className="sheet__text">
          <span className="sheet__title">{t('common.staff')}</span>
          <span className="sheet__sub">
            {canStaff ? t('menu.staff.sub.on') : t('menu.staff.sub.off')}
          </span>
        </span>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
      <p className="step__note">
        <Info size={16} aria-hidden="true" />
        {t('menu.note')}
      </p>
      <Button variant="tertiary" onClick={onClose}>{t('common.close')}</Button>
    </div>
  )
}
