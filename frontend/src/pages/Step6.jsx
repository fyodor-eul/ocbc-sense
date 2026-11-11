import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronDown, FileText, Mail, Smartphone } from 'lucide-react'
import StepScreen from '../components/StepScreen'
import StatusBanner from '../components/StatusBanner'
import Card from '../components/Card'
import Button from '../components/Button'
import Guidance from '../components/Guidance'
import GuidedTour from '../guidance/GuidedTour'
import PageReadAloud from '../components/PageReadAloud'
import Field from '../components/Field'
import Declaration from '../components/Declaration'
import DetailRow from '../components/DetailRow'
import { usePreferences } from '../context/PreferencesContext'
import { useJourney } from '../context/JourneyContext'
import usePageView from '../hooks/usePageView'
import useT from '../i18n/useT'
import { getPage, pageText, pageTitle } from '../data/content'
import { countryName } from '../data/countries'
import { docLabel } from '../data/documents'
import { logEvent, submitApplication } from '../api/client'

const DIAL_CODES = ['+852', '+60', '+62', '+86']
const LENGTHS = {
  '+852': [8, 8],
  '+60': [9, 10],
  '+62': [9, 12],
  '+86': [11, 11],
}

const DECLARATION_KEYS = ['s6.decl.1', 's6.decl.2', 's6.decl.3']

function validate(contact) {
  const errors = {}
  const digits = contact.mobile.replace(/\D/g, '')
  const [min, max] = LENGTHS[contact.dial] ?? [7, 15]

  if (digits.length < min || digits.length > max) errors.mobile = true
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) errors.email = true

  return errors
}

function maskMobile(contact) {
  const digits = contact.mobile.replace(/\D/g, '')
  return `${contact.dial} •••• ${digits.slice(-4)}`
}

export default function Step6() {
  const navigate = useNavigate()
  const { t, tw, lang } = useT()
  const { prefs } = usePreferences()

  const {
    sessionId,
    applicant,
    contact,
    saveContact,
    documentType,
    completeJourney,
    clearEligibility,
    durationSeconds,
  } = useJourney()

  const page = getPage('account.step6')
  usePageView('account.step6')

  const [stage, setStage] = useState('contact') // contact | review | submitting
  const [errors, setErrors] = useState({})
  const [agreed, setAgreed] = useState([false, false, false])
  const [declError, setDeclError] = useState(false)
  const [submitFailed, setSubmitFailed] = useState(false)

  const filled = contact.mobile.trim() !== '' && contact.email.trim() !== ''
  const errorCount = Object.keys(errors).length
  const locked = stage === 'submitting'
  const contactKey =
    errors.mobile || !contact.mobile.trim()
      ? 's6.guidance.contact'
      : errors.email || !contact.email.trim()
        ? 's6.guidance.email'
        : 's6.guidance.continue'
  const contactGuidance = tw(contactKey)
  const reviewGuidance =
    locked
      ? tw('s6.guidance.submitting')
      : !agreed.every(Boolean)
        ? tw('s6.guidance.declarations')
        : tw('s6.guidance.submit')

  function change(field, value) {
    saveContact({ ...contact, [field]: value })

    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  function continueToReview(event) {
    event.preventDefault()

    const found = validate(contact)
    setErrors(found)

    if (found.mobile) {
      logEvent(sessionId, 'account.step6', 'error', {
        code: 'CONTACT_MOBILE_INVALID',
      })
    }

    if (found.email) {
      logEvent(sessionId, 'account.step6', 'error', {
        code: 'CONTACT_EMAIL_INVALID',
      })
    }

    if (Object.keys(found).length) return

    setStage('review')
  }

  function toggleDeclaration(index) {
    const next = agreed.map((value, i) => (i === index ? !value : value))
    setAgreed(next)

    if (next.every(Boolean)) setDeclError(false)
  }

  async function submit() {
    if (!agreed.every(Boolean)) {
      setDeclError(true)
      logEvent(sessionId, 'account.step6', 'error', {
        code: 'DECLARATION_REQUIRED',
      })
      return
    }

    setSubmitFailed(false)
    setStage('submitting')

    try {
      const { reference } = await submitApplication(sessionId)

      logEvent(sessionId, 'account.submitted', 'page_view')
      logEvent(sessionId, 'account.submitted', 'journey_complete', {
        duration_s: durationSeconds(),
      })

      completeJourney(reference)
      navigate('/submitted', { replace: true })
    } catch {
      setSubmitFailed(true)
      setStage('review')
    }
  }

  function editCountry() {
    clearEligibility()
    navigate('/step/1')
  }

  // ---- Contact details
  if (stage === 'contact') {
    return (
      <StepScreen
        step={6}
        onBack={() => navigate('/step/5')}
        footer={
          <Button type="submit" form="contact-form" data-guide="continue" disabled={!filled}>
            {t('common.continue')}
          </Button>
        }
      >
        <h1 className="step__title">{t('s6.contact.title')}</h1>
        <PageReadAloud
          text={[t('s6.contact.title'), tw('s6.contact.intro'), contactGuidance].filter(Boolean).join('. ')}
        />
        <p className="step__intro">{tw('s6.contact.intro')}</p>
        <Guidance message={contactGuidance} />
        <GuidedTour
          steps={[
            {
              id: 'mobile',
              target: '#mobile',
              when: Boolean(errors.mobile) || !contact.mobile.trim(),
              guidanceKey: 's6.guidance.contact',
            },
            {
              id: 'email',
              target: '#email',
              when: Boolean(errors.email) || !contact.email.trim(),
              guidanceKey: 's6.guidance.email',
            },
            {
              id: 'continue',
              target: '[data-guide="continue"]',
              when: filled,
              guidanceKey: 's6.guidance.continue',
              side: 'top',
            },
          ]}
        />

        {errorCount > 0 && (
          <StatusBanner
            variant="error"
            label={
              errorCount > 1
                ? t('s6.err.countN', { n: errorCount })
                : t('s6.err.count1')
            }
          >
            {t('s6.err.saved')}
          </StatusBanner>
        )}

        <form
          id="contact-form"
          className="form-card"
          onSubmit={continueToReview}
          noValidate
        >
          <Field
            id="mobile"
            label={t('s6.mobile')}
            hint={t('s6.mobile.hint')}
            error={errors.mobile ? t('s6.mobile.error') : undefined}
          >
            <div className="phone-row">
              <div className="control-wrap control-wrap--dial">
                <select
                  className="control control--dial"
                  aria-label={t('s6.dial')}
                  value={contact.dial}
                  onChange={(event) => change('dial', event.target.value)}
                >
                  {DIAL_CODES.map((dial) => (
                    <option key={dial} value={dial}>
                      {dial}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="control-icon"
                  size={18}
                  aria-hidden="true"
                />
              </div>

              <input
                id="mobile"
                className={`control ${errors.mobile ? 'control--error' : ''}`.trim()}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="9123 4567"
                value={contact.mobile}
                onChange={(event) => change('mobile', event.target.value)}
                aria-invalid={errors.mobile ? true : undefined}
                aria-describedby={
                  errors.mobile ? 'mobile-error' : 'mobile-hint'
                }
              />
            </div>
          </Field>

          <Field
            id="email"
            label={t('s6.email')}
            hint={t('s6.email.hint')}
            error={errors.email ? t('s6.email.error') : undefined}
          >
            <input
              id="email"
              type="email"
              className={`control ${errors.email ? 'control--error' : ''}`.trim()}
              autoComplete="email"
              placeholder="name@example.com"
              value={contact.email}
              onChange={(event) => change('email', event.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'email-error' : 'email-hint'}
            />
          </Field>
        </form>

        <p className="step__caption">{t('s6.english')}</p>
      </StepScreen>
    )
  }

  // ---- Review and submit
  const count = agreed.filter(Boolean).length

  return (
    <StepScreen
      step={6}
      onBack={locked ? undefined : () => setStage('contact')}
      footer={
        <Button data-guide="submit" loading={locked} onClick={submit}>
          {locked ? t('s6.submitting') : t('s6.submit')}
        </Button>
      }
    >
      <h1 className="step__title">{pageTitle(page._id, lang)}</h1>
      <PageReadAloud
        text={[
          pageTitle(page._id, lang),
          pageText(page, prefs.wording, lang),
          reviewGuidance,
        ].filter(Boolean).join('. ')}
      />
      <p className="step__intro">{pageText(page, prefs.wording, lang)}</p>
      <Guidance message={reviewGuidance} />
      <GuidedTour
        steps={[
          {
            id: 'declarations',
            target: '.decls',
            when: !locked && !agreed.every(Boolean),
            guidanceKey: 's6.guidance.declarations',
            side: 'top',
          },
          {
            id: 'submit',
            target: '[data-guide="submit"]',
            when: !locked && agreed.every(Boolean),
            guidanceKey: 's6.guidance.submit',
            side: 'top',
          },
        ]}
      />

      {locked && (
        <StatusBanner variant="loading" label={t('s6.submitting.label')}>
          {t('common.keepOpen')}
        </StatusBanner>
      )}

      {declError && (
        <StatusBanner variant="error" label={t('s6.decl.error.label')}>
          {tw('s6.decl.error.text')}
        </StatusBanner>
      )}

      {submitFailed && (
        <StatusBanner variant="error" label={t('s6.submit.error.label')}>
          {tw('common.savedTryAgain')}
        </StatusBanner>
      )}

      <Card className="details">
        <h2 className="details__title">{t('detail.yourDetails')}</h2>

        <DetailRow
          icon={BookOpen}
          label={t('detail.country')}
          value={countryName(applicant.country, lang)}
          onEdit={locked ? undefined : editCountry}
        />

        <DetailRow
          icon={Smartphone}
          label={t('s6.mobile')}
          value={maskMobile(contact)}
          onEdit={locked ? undefined : () => setStage('contact')}
        />

        <DetailRow
          icon={Mail}
          label={t('s6.email')}
          value={contact.email}
          onEdit={locked ? undefined : () => setStage('contact')}
        />

        <DetailRow
          icon={FileText}
          label={t('s6.row.doc')}
          value={documentType ? docLabel(documentType, lang) : ''}
          onEdit={locked ? undefined : () => navigate('/step/5')}
        />
      </Card>

      <Card className="decls">
        <div className="decls__head">
          <h2 className="details__title">{t('s6.decl.title')}</h2>
          <span className="decls__count">
            {t('s6.decl.count', { n: count })}
          </span>
        </div>

        {DECLARATION_KEYS.map((key, index) => (
          <Declaration
            key={key}
            checked={agreed[index]}
            onToggle={() => toggleDeclaration(index)}
            error={declError && !agreed[index]}
            disabled={locked}
          >
            {t(key)}
          </Declaration>
        ))}
      </Card>
    </StepScreen>
  )
}
