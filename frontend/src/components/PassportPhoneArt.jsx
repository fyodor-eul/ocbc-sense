import useT from '../i18n/useT'

export default function PassportPhoneArt() {
  const { t } = useT()
  return (
    <svg
      viewBox="0 0 240 160"
      role="img"
      aria-label={t('art.passportPhone')}
      style={{ display: 'block', width: '100%', maxWidth: 260, margin: '1rem auto 0' }}
    >
      <g fill="none" stroke="#242424" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="36" y="18" width="88" height="124" rx="8" />
        <circle cx="80" cy="86" r="18" />
        <rect x="132" y="30" width="68" height="112" rx="12" />
        <path d="M154 44h24" />
      </g>
      <rect x="56" y="40" width="48" height="8" rx="4" fill="#CC0000" />
    </svg>
  )
}