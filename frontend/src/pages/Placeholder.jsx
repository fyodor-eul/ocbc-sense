import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Header from '../components/Header'
import Button from '../components/Button'
import useT from '../i18n/useT'

// Pass titleKey / messageKey (keys from src/i18n) so the text follows the chosen language.
export default function Placeholder({ titleKey, messageKey }) {
  const navigate = useNavigate()
  const { t } = useT()
  return (
    <Screen
      header={<Header onBack={() => navigate(-1)} />}
      footer={<Button variant="secondary" onClick={() => navigate('/welcome')}>{t('placeholder.backToStart')}</Button>}
    >
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t(titleKey)}</h1>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t(messageKey)}</p>
    </Screen>
  )
}
