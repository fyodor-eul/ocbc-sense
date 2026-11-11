import './NfcArt.css'
import useT from '../i18n/useT'

export default function NfcArt({ scanning = false }) {
  const { t } = useT()
  return (
    <svg
      viewBox="0 0 260 176"
      role="img"
      aria-label={t('art.nfc')}
      className={`nfc-art ${scanning ? 'nfc-art--scanning' : ''}`.trim()}
    >
      <g fill="#fff" stroke="#242424" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="30" y="34" width="100" height="124" rx="10" />
        <circle cx="80" cy="104" r="20" fill="none" />
        <rect x="96" y="18" width="74" height="132" rx="14" />
        <path d="M120 32h26" fill="none" />
      </g>
      <rect x="50" y="50" width="52" height="9" rx="4.5" fill="#CC0000" />
      <g className="nfc-art__waves" fill="none" stroke="#CC0000" strokeWidth="3" strokeLinecap="round">
        <path d="M184 74a20 20 0 0 1 0 32" />
        <path d="M196 64a34 34 0 0 1 0 52" />
        <path d="M208 54a48 48 0 0 1 0 72" />
      </g>
    </svg>
  )
}