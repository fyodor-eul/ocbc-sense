import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronDown, Contact, Smartphone } from 'lucide-react'
import StepScreen from '../components/StepScreen'
import ChecklistItem from '../components/ChecklistItem'
import Button from '../components/Button'
import Guidance from '../components/Guidance'
import GuidedTour from '../guidance/GuidedTour'
import PageReadAloud from '../components/PageReadAloud'
import { usePreferences } from '../context/PreferencesContext'
import { useJourney } from '../context/JourneyContext'
import usePageView from '../hooks/usePageView'
import useT from '../i18n/useT'
import { getPage, pageText, pageTitle } from '../data/content'

const ITEMS = [
  { key: 'passport', icon: BookOpen, text: 's2.passport' },
  { key: 'nationalId', icon: Contact, text: 's2.id' },
  { key: 'phone', icon: Smartphone, text: 's2.phone' },
]

const NEXT_KEYS = ['s2.guidance.passport', 's2.guidance.id', 's2.guidance.phone']

export default function Step2() {
  const navigate = useNavigate()
  const { t, tw, lang } = useT()
  const { prefs } = usePreferences()
  const { checklist, toggleChecklist } = useJourney()
  const page = getPage('account.step2')
  usePageView('account.step2')

  const count = ITEMS.filter((i) => checklist[i.key]).length
  const allReady = count === ITEMS.length
  const nextIndex = ITEMS.findIndex((i) => !checklist[i.key])
  const guidanceMessage =
    count === 0
      ? tw('s2.guidance.passport')
      : !checklist.nationalId
        ? tw('s2.guidance.id')
        : !checklist.phone
          ? tw('s2.guidance.phone')
          : tw('s2.guidance.continue')

  return (
    <StepScreen
      step={2}
      onBack={() => navigate('/step/1')}
      progressRight={t('step.readyCount', { n: count })}
      footer={
        <Button data-guide="continue" disabled={!allReady} onClick={() => navigate('/step/3')}>
          {allReady ? t('common.continue') : t('s2.cta.disabled')}
        </Button>
      }
    >
      <h1 className="step__title">{pageTitle(page._id, lang)}</h1>
      <PageReadAloud
        text={[
          pageTitle(page._id, lang),
          pageText(page, prefs.wording, lang),
          guidanceMessage,
        ].filter(Boolean).join('. ')}
      />
      <p className="step__intro">{pageText(page, prefs.wording, lang)}</p>
      <Guidance message={guidanceMessage} />
      <GuidedTour
        steps={[
          {
            id: `item-${nextIndex}`,
            target: `.checklist .check:nth-child(${nextIndex + 1})`,
            when: nextIndex >= 0,
            guidanceKey: NEXT_KEYS[nextIndex],
          },
          {
            id: 'continue',
            target: '[data-guide="continue"]',
            when: allReady,
            guidanceKey: 's2.guidance.continue',
            side: 'top',
          },
        ]}
      />

      <div className="checklist" role="group" aria-label={t('s2.group')}>
        {ITEMS.map((item) => (
          <ChecklistItem
            key={item.key}
            icon={item.icon}
            label={t(`${item.text}.label`)}
            note={t(`${item.text}.note`)}
            checked={checklist[item.key]}
            onToggle={() => toggleChecklist(item.key)}
          />
        ))}
      </div>

      <details className="expander">
        <summary>
          {t('s2.nfc.q')}
          <ChevronDown size={20} aria-hidden="true" />
        </summary>
        <p>{tw('s2.nfc.a', { ask: t('help.button') })}</p>
      </details>
    </StepScreen>
  )
}
