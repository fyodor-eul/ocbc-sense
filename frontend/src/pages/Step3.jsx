import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, Smartphone, X } from 'lucide-react'
import StepScreen from '../components/StepScreen'
import StatusBanner from '../components/StatusBanner'
import Card from '../components/Card'
import Button from '../components/Button'
import Guidance from '../components/Guidance'
import GuidedTour from '../guidance/GuidedTour'
import PageReadAloud from '../components/PageReadAloud'
import NfcArt from '../components/NfcArt'
import { usePreferences } from '../context/PreferencesContext'
import { useJourney } from '../context/JourneyContext'
import { usePresenter } from '../context/PresenterContext'
import { useHelp } from '../context/HelpContext'
import usePageView from '../hooks/usePageView'
import useT from '../i18n/useT'
import { getPage, pageText, pageTitle } from '../data/content'
import { simulateNfcScan } from '../api/simulate'
import { logEvent } from '../api/client'

// The wording of each failure lives in src/i18n (s3.fail.<CODE>.label / .text / .tip).
const FAILURE_CODES = ['NFC_NOT_SUPPORTED', 'NFC_CHIP_NOT_FOUND', 'NFC_READ_FAILED']

export default function Step3() {
  const navigate = useNavigate()
  const { t, tw, lang } = useT()
  const { prefs } = usePreferences()
  const { sessionId, done, attempts, markDone, recordAttempt } = useJourney()
  const { scenarios } = usePresenter()
  const { openStaff } = useHelp()
  const page = getPage('account.step3')
  usePageView('account.step3')

  const [phase, setPhase] = useState(done.nfc ? 'success' : 'ready') // ready | scanning | failed | success
  const [errorCode, setErrorCode] = useState(null)
  const runId = useRef(0)

  // If the customer leaves while a scan is running, ignore its result.
  useEffect(() => () => { runId.current += 1 }, [])

  async function startScan() {
    const id = ++runId.current
    setPhase('scanning')
    const attempt = attempts.nfc
    recordAttempt('nfc')
    const result = await simulateNfcScan(scenarios.nfc, attempt)
    if (id !== runId.current) return
    if (result.ok) {
      markDone('nfc')
      setPhase('success')
    } else {
      logEvent(sessionId, 'account.step3', 'error', { code: result.code })
      setErrorCode(result.code)
      setPhase('failed')
    }
  }

  function cancelScan() {
    runId.current += 1
    setPhase('ready')
  }

  function scanAgain() {
    markDone('nfc', false)
    setPhase('ready')
  }

  const frame = (footer, body) => (
    <StepScreen step={3} onBack={() => navigate('/step/2')} footer={footer}>
      {body}
    </StepScreen>
  )
  const title = pageTitle(page._id, lang)
  const intro = <p className="step__intro">{pageText(page, prefs.wording, lang)}</p>
  const guidanceMessage =
    phase === 'scanning'
      ? tw('s3.guidance.wait')
      : phase === 'success'
        ? tw('s3.guidance.continue')
        : phase === 'failed'
          ? tw('s3.guidance.position')
          : tw('s3.guidance.start')

  if (phase === 'scanning') {
    return frame(
      <Button variant="secondary" onClick={cancelScan}>
        <X size={18} aria-hidden="true" /> {t('s3.cancel')}
      </Button>,
      <>
        <h1 className="step__title">{t('s3.reading')}</h1>
        {intro}
        <PageReadAloud
          text={[t('s3.reading'), pageText(page, prefs.wording, lang), guidanceMessage].filter(Boolean).join('. ')}
        />
        <Guidance message={guidanceMessage} />
        <GuidedTour
          steps={[
            {
              id: 'scan',
              target: '.art-card',
              when: true,
              guidanceKey: 's3.guidance.wait',
            },
          ]}
        />
        <Card className="art-card"><NfcArt scanning /></Card>
        <StatusBanner variant="loading" label={tw('s3.wait')} />
      </>
    )
  }

  if (phase === 'success') {
    return frame(
      <>
        <Button data-guide="continue" onClick={() => navigate('/step/4')}>{t('common.continue')}</Button>
        <Button variant="tertiary" onClick={scanAgain}>{t('s3.again')}</Button>
      </>,
      <>
        <h1 className="step__title">{title}</h1>
        <PageReadAloud
          text={[title, pageText(page, prefs.wording, lang), guidanceMessage].filter(Boolean).join('. ')}
        />
        <Guidance message={guidanceMessage} />
        <GuidedTour
          steps={[
            {
              id: 'continue',
              target: '[data-guide="continue"]',
              when: true,
              guidanceKey: 's3.guidance.continue',
              side: 'top',
            },
          ]}
        />
        <StatusBanner variant="success" label={t('s3.success.label')}>
          {t('s3.success.text')}
        </StatusBanner>
      </>
    )
  }

  if (phase === 'failed') {
    const code = FAILURE_CODES.includes(errorCode) ? errorCode : 'NFC_READ_FAILED'
    return frame(
      <>
        <Button data-guide="retry" onClick={startScan}>
          <RotateCcw size={18} aria-hidden="true" /> {t('s3.retry')}
        </Button>
        <Button variant="secondary" onClick={openStaff}>{t('common.staff')}</Button>
      </>,
      <>
        <h1 className="step__title">{title}</h1>
        {intro}
        <PageReadAloud
          text={[title, pageText(page, prefs.wording, lang), guidanceMessage].filter(Boolean).join('. ')}
        />
        <Guidance message={guidanceMessage} />
        <GuidedTour
          steps={[
            {
              id: 'retry',
              target: '[data-guide="retry"]',
              when: true,
              guidanceKey: 's3.guidance.position',
              side: 'top',
            },
          ]}
        />
        <StatusBanner variant="error" label={t(`s3.fail.${code}.label`)}>
          {tw('common.withSaved', { text: tw(`s3.fail.${code}.text`) })}
        </StatusBanner>
        <StatusBanner variant="tip" label={t('common.tryThis')}>{tw(`s3.fail.${code}.tip`)}</StatusBanner>
      </>
    )
  }

  return frame(
    <Button data-guide="start" onClick={startScan}>
      <Smartphone size={20} aria-hidden="true" /> {t('s3.start')}
    </Button>,
    <>
      <h1 className="step__title">{title}</h1>
      {intro}
      <PageReadAloud
        text={[title, pageText(page, prefs.wording, lang), guidanceMessage].filter(Boolean).join('. ')}
      />
      <Guidance message={guidanceMessage} />
      <GuidedTour
        steps={[
          {
            id: 'start',
            target: '[data-guide="start"]',
            when: true,
            guidanceKey: 's3.guidance.start',
            side: 'top',
          },
        ]}
      />
      <Card className="art-card">
        <NfcArt />
        <p className="step__caption">{tw('s3.caption')}</p>
      </Card>
    </>
  )
}
