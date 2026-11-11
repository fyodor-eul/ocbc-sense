import { useNavigate } from 'react-router-dom'
import { Check, Globe, LayoutGrid, MessageSquare, Type, Volume2, VolumeX } from 'lucide-react'
import Screen from '../components/Screen'
import Header from '../components/Header'
import Button from '../components/Button'
import { usePreferences } from '../context/PreferencesContext'
import useT from '../i18n/useT'
import PageReadAloud from '../components/PageReadAloud'
import './Prefs.css'

export default function PrefsSaved() {
  const navigate = useNavigate()
  const { t } = useT()
  const { prefs } = usePreferences()

  const rows = [
    { icon: Type, label: t('prefs.size.title'), value: t(`size.${prefs.textSize}`) },
    { icon: Globe, label: t('prefs.lang.title'), value: t(`lang.${prefs.language}.short`) },
    { icon: MessageSquare, label: t('wording.title'), value: t(`wording.${prefs.wording}`) },
    {
      icon: prefs.readAloud ? Volume2 : VolumeX,
      label: t('read.title'),
      value: prefs.readAloud ? t('common.on') : t('common.off'),
    },
    { icon: LayoutGrid, label: t('layout.title'), value: t(`layout.${prefs.layout}`) },
  ]

  return (
    <Screen
      header={<Header desktopOnly />}
      footer={<Button onClick={() => navigate('/signup')}>{t('saved.continue')}</Button>}
    >
      <div className="saved">
        <span className="saved__icon saved__icon--ok" aria-hidden="true">
          <Check size={32} />
        </span>

        <h1 className="saved__title">{t('saved.title')}</h1>
        <PageReadAloud
          text={[t('saved.title'), t('saved.intro')].filter(Boolean).join('. ')}
        />
        <p className="saved__intro">{t('saved.intro')}</p>

        <div className="summary">
          {rows.map(({ icon: Icon, label, value }) => (
            <div className="summary__row" key={label}>
              <span className="summary__label">
                <Icon size={20} aria-hidden="true" /> {label}
              </span>
              <span className="summary__value">{value}</span>
            </div>
          ))}

          <div className="summary__row">
            <Button variant="tertiary" onClick={() => navigate('/preferences/1')}>
              {t('saved.change')}
            </Button>
          </div>
        </div>
      </div>
    </Screen>
  )
}
