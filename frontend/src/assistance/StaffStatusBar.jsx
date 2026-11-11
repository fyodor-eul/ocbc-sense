import Button from '../components/Button'
import useT from '../i18n/useT'

export default function StaffStatusBar({ staff, onOpen }) {
  const { t } = useT()
  const { status, position, unread } = staff
  const text =
    status === 'waiting' ? (position <= 1 ? t('bar.next') : t('bar.position', { n: position }))
    : status === 'joined' ? (unread ? t('bar.new') : t('staff.joined'))
    : t('staff.done')
  return (
    <div className="staffbar" role="status">
      <span className="staffbar__text">{text}</span>
      <Button variant="secondary" fullWidth={false} onClick={onOpen}>{status === 'resolved' ? t('staff.continue') : t('bar.view')}</Button>
    </div>
  )
}
