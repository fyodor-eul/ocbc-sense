import { useState } from 'react'
import Screen from '../components/Screen'
import Header from '../components/Header'
import LanguagePill from '../components/LanguagePill'
import ProgressBar from '../components/ProgressBar'
import StatusBanner from '../components/StatusBanner'
import Card from '../components/Card'
import Button from '../components/Button'
import AskSenseButton from '../components/AskSenseButton'
import StepList from '../components/StepList'

const STEPS = [
  "Check you're eligible",
  'Get ready',
  'Scan your passport chip',
  "Verify it's you",
  'Supporting documents',
  'Review and submit',
]
export default function DesignSystem() {
  const [lang, setLang] = useState('en')


  function setSize(value) {
    document.documentElement.dataset.textSize = value
  }

  return (
    <Screen
  header={<Header onBack={() => {}} onSettings={() => {}} />}
  aside={<StepList steps={STEPS} current={3} />}
      footer={
        <>
          <Button>Primary action</Button>
          <AskSenseButton onClick={() => alert('Help opens here')} />
        </>
      }
    >
      <h1 style={{ fontSize: '1.375rem', margin: 0 }}>Design system</h1>

      <Card>
        <p style={{ margin: '0 0 0.75rem' }}>Welcome-style header pill</p>
        <LanguagePill value={lang} onChange={setLang} />
      </Card>

      <ProgressBar current={1} />
      <ProgressBar current={3} />
      <ProgressBar current={1} total={2} label="Personalise · 1 of 2" />

      <StatusBanner variant="success" label="Passport read">
        This is simulated.
      </StatusBanner>
      <StatusBanner variant="error" label="Scan failed">
        We couldn't find the chip. Your information is saved.
      </StatusBanner>
      <StatusBanner variant="tip" label="Try this">
        Place your phone flat on the passport cover and keep still.
      </StatusBanner>
      <StatusBanner variant="loading" label="Reading your passport…">
        Keep your phone still. This takes a few seconds.
      </StatusBanner>

      <Button variant="secondary">Secondary button</Button>
      <Button variant="outline">Outline button</Button>
      <Button variant="tertiary">Tertiary button</Button>
      <Button loading>Checking…</Button>
      <Button disabled>Disabled button</Button>

      <Card>
        <p style={{ margin: '0 0 0.75rem' }}>Text size test</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" fullWidth={false} onClick={() => setSize('default')}>Default</Button>
          <Button variant="secondary" fullWidth={false} onClick={() => setSize('large')}>Large</Button>
          <Button variant="secondary" fullWidth={false} onClick={() => setSize('xlarge')}>Largest</Button>
        </div>
      </Card>
    </Screen>
  )
}