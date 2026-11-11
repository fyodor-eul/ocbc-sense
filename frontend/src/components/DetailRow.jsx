import Button from './Button'
import useT from '../i18n/useT'

export default function DetailRow({ icon: Icon, label, value, onEdit }) {
  const { t } = useT()
  return (
    <div className="detail">
      <span className="detail__icon" aria-hidden="true"><Icon size={20} /></span>
      <span className="detail__text">
        <span className="detail__label">{label}</span>
        <span className="detail__value">{value}</span>
      </span>
      {onEdit && (
        <Button variant="tertiary" aria-label={t('common.editField', { label })} onClick={onEdit}>{t('common.edit')}</Button>
      )}
    </div>
  )
}