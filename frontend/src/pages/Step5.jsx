import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Info, RotateCcw, Upload } from 'lucide-react'
import StepScreen from '../components/StepScreen'
import StatusBanner from '../components/StatusBanner'
import Card from '../components/Card'
import Button from '../components/Button'
import Guidance from '../components/Guidance'
import GuidedTour from '../guidance/GuidedTour'
import PageReadAloud from '../components/PageReadAloud'
import OptionCard from '../components/OptionCard'
import { usePreferences } from '../context/PreferencesContext'
import { useJourney } from '../context/JourneyContext'
import { usePresenter } from '../context/PresenterContext'
import { useHelp } from '../context/HelpContext'
import usePageView from '../hooks/usePageView'
import useT from '../i18n/useT'
import { getPage, pageText, pageTitle } from '../data/content'
import { DOC_TYPES, docLabel } from '../data/documents'
import { simulateDocumentUpload } from '../api/simulate'
import { logEvent } from '../api/client'

// The wording of each failure lives in src/i18n (s5.fail.<CODE>.label / .text / .tip).
const FAILURE_CODES = ['DOC_UNREADABLE', 'DOC_WRONG_TYPE']

export default function Step5() {
  const navigate = useNavigate()
  const { t, tw, lang } = useT()
  const { prefs } = usePreferences()
  const { sessionId, done, attempts, markDone, recordAttempt, documentType, setDocumentType } = useJourney()
  const { scenarios } = usePresenter()
  const { openStaff } = useHelp()
  const page = getPage('account.step5')
  usePageView('account.step5')

  const [phase, setPhase] = useState(done.doc ? 'uploaded' : 'choose') // choose | uploading | failed | uploaded
  const [errorCode, setErrorCode] = useState(null)
  const runId = useRef(0)

  useEffect(() => () => { runId.current += 1 }, [])

  const typeLabel = documentType ? docLabel(documentType, lang) : ''
  const guidanceMessage =
    phase === 'uploading'
      ? tw('s5.guidance.upload')
      : phase === 'uploaded'
        ? tw('s5.guidance.continue')
        : phase === 'failed'
          ? tw('s5.guidance.retry')
          : !documentType
            ? tw('s5.guidance.type')
            : tw('s5.guidance.ready')

  function choose(id) {
    setDocumentType(id)
    if (done.doc) {
      markDone('doc', false)
      setPhase('choose')
    }
  }

  async function upload() {
    const id = ++runId.current
    setPhase('uploading')
    const attempt = attempts.doc
    recordAttempt('doc')
    const result = await simulateDocumentUpload(scenarios.doc, attempt)
    if (id !== runId.current) return
    if (result.ok) {
      markDone('doc')
      setPhase('uploaded')
    } else {
      logEvent(sessionId, 'account.step5', 'error', { code: result.code })
      setErrorCode(result.code)
      setPhase('failed')
    }
  }

  function replace() {
    markDone('doc', false)
    setPhase('choose')
  }

  const frame = (footer, body) => (
    <StepScreen step={5} onBack={() => navigate('/step/4')} footer={footer}>
      {body}
    </StepScreen>
  )
  const title = pageTitle(page._id, lang)
  const intro = <p className="step__intro">{pageText(page, prefs.wording, lang)}</p>
  const fileCard = (extra) => (
    <Card className="details">
      <div className="detail">
        <span className="detail__icon" aria-hidden="true"><FileText size={20} /></span>
        <span className="detail__text">
          <span className="detail__label">{typeLabel}</span>
          <span className="detail__value">{t('s5.filename')}</span>
        </span>
        {extra}
      </div>
    </Card>
  )

  if (phase === 'uploading') {
    return frame(
      <Button disabled loading>{t('s5.uploading')}</Button>,
      <>
        <h1 className="step__title">{title}</h1>
        <PageReadAloud
          text={[title, pageText(page, prefs.wording, lang), guidanceMessage].filter(Boolean).join('. ')}
        />
        <Guidance message={guidanceMessage} />
        {fileCard()}
        <StatusBanner variant="loading" label={t('s5.uploading.label')}>{t('common.keepOpen')}</StatusBanner>
      </>
    )
  }

  if (phase === 'uploaded') {
    return frame(
      <Button data-guide="continue" onClick={() => navigate('/step/6')}>{t('common.continue')}</Button>,
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
              guidanceKey: 's5.guidance.continue',
              side: 'top',
            },
          ]}
        />
        <StatusBanner variant="success" label={t('s5.added.label')}>
          {t('s5.added.text')}
        </StatusBanner>
        {fileCard(<Button variant="tertiary" onClick={replace}>{t('s5.replace')}</Button>)}
      </>
    )
  }

  if (phase === 'failed') {
    const code = FAILURE_CODES.includes(errorCode) ? errorCode : 'DOC_UNREADABLE'
    return frame(
      <>
        <Button data-guide="retry" onClick={upload}>
          <RotateCcw size={18} aria-hidden="true" /> {t('s5.again')}
        </Button>
        <Button variant="secondary" onClick={openStaff}>{t('common.staff')}</Button>
        <Button variant="tertiary" onClick={() => setPhase('choose')}>{t('s5.changeType')}</Button>
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
              guidanceKey: 's5.guidance.retry',
              side: 'top',
            },
          ]}
        />
        <StatusBanner variant="error" label={t(`s5.fail.${code}.label`)}>
          {tw('common.withSaved', { text: tw(`s5.fail.${code}.text`) })}
        </StatusBanner>
        <StatusBanner variant="tip" label={t('common.tryThis')}>{tw(`s5.fail.${code}.tip`)}</StatusBanner>
        {fileCard()}
      </>
    )
  }

  return frame(
    <Button data-guide="upload" disabled={!documentType} onClick={upload}>
      <Upload size={20} aria-hidden="true" /> {t('s5.cta')}
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
            id: 'type',
            target: '.doc-list',
            when: !documentType,
            guidanceKey: 's5.guidance.type',
          },
          {
            id: 'upload',
            target: '[data-guide="upload"]',
            when: Boolean(documentType),
            guidanceKey: 's5.guidance.ready',
            side: 'top',
          },
        ]}
      />
      <h2 className="step__subtitle">{t('s5.choose')}</h2>
      <div className="doc-list" role="group" aria-label={t('s5.group')}>
        {DOC_TYPES.map((d) => (
          <OptionCard key={d.id} selected={documentType === d.id} onSelect={() => choose(d.id)}>
            <span className="option__title">{docLabel(d.id, lang)}</span>
          </OptionCard>
        ))}
      </div>
      <p className="step__note">
        <Info size={16} aria-hidden="true" />
        {tw('s5.note')}
      </p>
    </>
  )
}
