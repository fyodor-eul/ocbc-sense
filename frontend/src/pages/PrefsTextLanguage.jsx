import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import Screen from '../components/Screen'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import OptionCard from '../components/OptionCard'
import Button from '../components/Button'
import { usePreferences } from '../context/PreferencesContext'
import { LANGUAGE_OPTIONS, TEXT_SIZES } from '../data/options'
import useT from '../i18n/useT'
import PageReadAloud from '../components/PageReadAloud'
import './Prefs.css'

export default function PrefsTextLanguage() {
  const navigate = useNavigate()
  const { t } = useT()
  const { prefs, update } = usePreferences()


  return (
    <Screen header={<Header onBack={() => navigate('/welcome')} />}>
      <ProgressBar current={1} total={2} label={t('prefs.progress', { n: 1, total: 2 })} />
      <h1 className="prefs__title">{t('prefs1.title')}</h1>
      <PageReadAloud
        text={[t('prefs1.title'), t('prefs1.intro'), t('prefs.size.title'), t('prefs.lang.title')].filter(Boolean).join('. ')}
      />
      <p className="prefs__intro">{t('prefs1.intro')}</p>

      <section className="prefs__section" aria-labelledby="size-h">
        <h2 id="size-h" className="prefs__heading">{t('prefs.size.title')}</h2>
        <div className="prefs__grid">
          {TEXT_SIZES.map((s) => (
            <OptionCard key={s.id} selected={prefs.textSize === s.id} onSelect={() => update({ textSize: s.id })}>
              <span className="aa" style={{ fontSize: s.aa }}>Aa</span>
              <span className="option__title">{t(`size.${s.id}`)}</span>
             
            </OptionCard>
          ))}
        </div>
      </section>

      <section className="preview" aria-label={t('prefs.preview.title')}>
        <div className="preview__head">
          <span className="preview__title"> {t('prefs.preview.title')}</span>
          <span className="preview__tag">{t(`size.${prefs.textSize}`)}</span>
        </div>
        <p className="preview__sample">{t('prefs.sample')}</p>
      
      </section>

      <section className="prefs__section" aria-labelledby="lang-h">
        <h2 id="lang-h" className="prefs__heading">{t('prefs.lang.title')}</h2>
        {LANGUAGE_OPTIONS.map((l) => (
          <OptionCard key={l.id} selected={prefs.language === l.id} onSelect={() => update({ language: l.id })}>
            <span className="lang-row">
              <span className="lang-badge" aria-hidden="true">{l.badge}</span>
              <span className="lang-text">
                <span className="option__title">{t(`lang.${l.id}.name`)}</span>
                <span className="option__note">{t(`lang.${l.id}.note`)}</span>
              </span>
            </span>
          </OptionCard>
        ))}
      </section>

      <div className="prefs__actions">
        <Button onClick={() => navigate('/preferences/2')}>{t('prefs.next')}</Button>
      </div>
    </Screen>
  )
}
