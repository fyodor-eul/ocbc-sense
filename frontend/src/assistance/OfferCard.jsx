import { Headset, MessageSquare } from 'lucide-react'
import Button from '../components/Button'
import useT from '../i18n/useT'

// The reason is always stated, so no separate "Why am I seeing this?" is needed.
const REASON_KEYS = {
  long_pause: 'offer.reason.long_pause',
  back_and_forth: 'offer.reason.back_and_forth',
  repeated_errors: 'offer.reason.repeated_errors',
}

export default function OfferCard({ trigger, onChat, onStaff, onNo, onNever }) {
  const { t } = useT()
  return (
    <section className="offer" role="region" aria-labelledby="offer-title">
      <span className="sheet__icon sheet__icon--red" aria-hidden="true"><Headset size={22} /></span>
      <div className="offer__head">
        <h2 id="offer-title" className="offer__title">{t('offer.title')}</h2>
        <p className="offer__reason">{t(REASON_KEYS[trigger] ?? REASON_KEYS.long_pause)}</p>
      </div>
      <Button onClick={onChat}>
        <MessageSquare size={18} aria-hidden="true" /> {t('menu.chat')}
      </Button>
      <Button variant="secondary" onClick={onStaff}>{t('common.staff')}</Button>
      <div className="offer__foot">
        <button className="link-btn" onClick={onNo}>{t('offer.no')}</button>
        <button className="link-btn link-btn--muted" onClick={onNever}>{t('offer.never')}</button>
      </div>
    </section>
  )
}
