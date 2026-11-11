import { useId, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Banknote, ChevronDown, CircleCheck, FileText, Wallet } from 'lucide-react'
import Screen from '../components/Screen'
import Header from '../components/Header'
import Button from '../components/Button'
import Guidance from '../components/Guidance'
import GuidedTour from '../guidance/GuidedTour'
import PageReadAloud from '../components/PageReadAloud'
import { useJourney } from '../context/JourneyContext'
import useT from '../i18n/useT'
import { pageInfo, pageTitle } from '../data/content'
import { DOC_TYPES, docLabel } from '../data/documents'

function Accordion({ icon: Icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  return (
    <section className="acc">
      <h2 className="acc__h">
        <button className="acc__btn" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
          <span className="acc__icon" aria-hidden="true"><Icon size={20} /></span>
          <span className="acc__title">{title}</span>
          <ChevronDown className={`acc__chev ${open ? 'acc__chev--open' : ''}`.trim()} size={20} aria-hidden="true" />
        </button>
      </h2>
      {open && <div id={panelId} className="acc__panel">{children}</div>}
    </section>
  )
}

export default function WhatNext() {
  const navigate = useNavigate()
  const { t, tw, lang } = useT()
  const { reference } = useJourney()

  if (!reference) return <Navigate to="/welcome" replace />

  function done() {
    navigate('/home')
  }

  return (
    <Screen
      header={<Header onBack={() => navigate('/home')} />}
      footer={<Button onClick={done}>{t('sub.home')}</Button>}
    >
      <h1 className="step__title">{pageTitle('account.submitted', lang)}</h1>
      <PageReadAloud
        text={[
          pageTitle('account.submitted', lang),
          pageInfo('account.submitted', lang),
          tw('next.guidance.email'),
        ].filter(Boolean).join('. ')}
      />
      <p className="step__intro">{pageInfo('account.submitted', lang)}</p>
      <Guidance message={tw('next.guidance.email')} />
      <GuidedTour
        steps={[
          {
            id: 'first',
            target: '.acc',
            when: true,
            guidanceKey: 'next.guidance.email',
          },
        ]}
      />

      <Accordion icon={FileText} title={t('wn.doc.title')} defaultOpen>
        <p>{tw('wn.doc.text')}</p>
        <p className="acc__label">{t('wn.doc.accepted')}</p>
        <ul className="acc__list">
          {DOC_TYPES.map((d) => (
            <li key={d.id}>
              <CircleCheck size={18} aria-hidden="true" />
              <span>{docLabel(d.id, lang)}</span>
            </li>
          ))}
        </ul>
      </Accordion>

      <Accordion icon={Wallet} title={t('wn.acct.title')}>
        <p>{tw('wn.acct.text')}</p>
      </Accordion>

      <Accordion icon={Banknote} title={t('wn.dep.title')}>
        <p>{tw('wn.dep.1')}</p>
        <p>{tw('wn.dep.2')}</p>
        <p>{tw('wn.dep.3')}</p>
      </Accordion>

      <p className="step__caption">{t('wn.caption')}</p>
    </Screen>
  )
}
