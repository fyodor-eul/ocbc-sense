import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'
import Screen from '../components/Screen'
import Header from '../components/Header'
import Card from '../components/Card'
import Button from '../components/Button'
import Guidance from '../components/Guidance'
import GuidedTour from '../guidance/GuidedTour'
import PageReadAloud from '../components/PageReadAloud'
import { usePreferences } from '../context/PreferencesContext'
import { useJourney } from '../context/JourneyContext'
import useT from '../i18n/useT'
import { getPage, pageText } from '../data/content'

export default function Submitted() {
  const navigate = useNavigate()
  const { t, tw, lang } = useT()
  const { prefs } = usePreferences()
  const { reference } = useJourney()
  const [copied, setCopied] = useState('') // '' | 'ok' | 'failed'
  const page = getPage('account.submitted')

  if (!reference) return <Navigate to="/welcome" replace />

  async function copy() {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied('ok')
    } catch {
      setCopied('failed')
    }
  }

  function home() {
    navigate('/home')
  }

  return (
    <Screen
      header={<Header desktopOnly />}
      footer={
        <>
          <Button onClick={home}>{t('sub.home')}</Button>
          <Button variant="tertiary" data-guide="details" onClick={() => navigate('/next')}>{t('sub.details')}</Button>
        </>
      }
    >
      <div className="saved">
        <span className="saved__icon saved__icon--ok" aria-hidden="true"><Check size={32} /></span>
        <h1 className="saved__title">{t('sub.title')}</h1>
        <PageReadAloud
          text={[
            t('sub.title'),
            pageText(page, prefs.wording, lang),
            tw('sub.guidance.next'),
          ].filter(Boolean).join('. ')}
        />
        <p className="saved__intro">{pageText(page, prefs.wording, lang)}</p>
        <Guidance message={tw('sub.guidance.next')} />
        <GuidedTour
          steps={[
            {
              id: 'details',
              target: '[data-guide="details"]',
              when: true,
              guidanceKey: 'sub.guidance.next',
              side: 'top',
            },
          ]}
        />
      </div>

      <Card className="ref-card">
        <p className="ref-card__label">{t('common.refLabel')}</p>
        <p className="ref-card__number">{reference}</p>
        <Button variant="secondary" onClick={copy}>
          <Copy size={18} aria-hidden="true" /> {t('common.copyRef')}
        </Button>
        <p className="step__caption" role="status">
          {copied === 'ok' && t('common.copied')}
          {copied === 'failed' && t('common.copyFailed')}
        </p>
      </Card>

      <h2 className="step__subtitle">{t('next.heading')}</h2>
      <Card>
        <ol className="next-steps">
          {[1, 2, 3].map((n) => (
            <li key={n}>
              <span className="next-steps__num" aria-hidden="true">{n}</span>
              <div>
                <p className="next-steps__title">{t(`next.${n}.title`)}</p>
                <p className="next-steps__text">{tw(`next.${n}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </Screen>
  )
}
