import { CircleCheck, ShieldCheck } from 'lucide-react'
import Button from '../components/Button'
import { errorLabel } from '../data/errors'
import { pageTitle } from '../data/content'
import useT from '../i18n/useT'

const LANGUAGE_NAMES = { en: 'lang.en.short', zh: 'lang.zh.short', ms: 'lang.ms.short' }

export default function ConsentSheet({ share, onShare, onBack }) {
  const { t, lang } = useT()
  const tried = [
    share.tried.tip && t('consent.tip'),
    share.tried.chat && t('consent.chat'),
  ].filter(Boolean)
  // The summary sent to staff stays in English. What the customer reads follows their language.
  const stepTitle = share.step_no ? pageTitle(`account.step${share.step_no}`, lang) : share.step_title
  const sizeKey = `consent.size.${share.preferences.text_size}`
  const sizeText = t(sizeKey) === sizeKey ? t('consent.size.default') : t(sizeKey)

  return (
    <div className="sheet">
      <p className="dialog__body">{t('consent.intro')}</p>

      <dl className="summary">
        <div>
          <dt>{t('consent.step')}</dt>
          <dd>{t('consent.stepValue', { n: share.step_no, title: stepTitle })}</dd>
        </div>
        <div>
          <dt>{t('consent.what')}</dt>
          <dd>{share.last_error ? errorLabel(share.last_error, lang) : t('consent.noError')}</dd>
        </div>
        <div>
          <dt>{t('consent.tried')}</dt>
          <dd>
            {tried.length === 0 ? t('consent.none') : (
              <span className="chips">
                {tried.map((label) => (
                  <span key={label} className="chip chip--done"><CircleCheck size={14} aria-hidden="true" /> {label}</span>
                ))}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>{t('consent.settings')}</dt>
          <dd>
            {share.preferences.wording === 'simple' ? t('consent.wordingSimple') : t('consent.wordingStandard')} ·{' '}
            {sizeText} · {t(LANGUAGE_NAMES[share.preferences.language] ?? LANGUAGE_NAMES.en)}
          </dd>
        </div>
      </dl>

      <p className="step__note">
        <ShieldCheck size={16} aria-hidden="true" />
        {t('consent.note')}
      </p>

      <Button onClick={onShare}>{t('consent.share')}</Button>
      <Button variant="tertiary" onClick={onBack}>{t('consent.back')}</Button>
    </div>
  )
}
