import './ProgressBar.css'
import useT from '../i18n/useT'

export default function ProgressBar({ current, total = 6, label, right }) {
  const { t } = useT()
  const text = label ?? t('step.label', { n: current, total })
  return (
    <div className="progress">
      <div className="progress__top">
        <p className="progress__label">{text}</p>
        {right && <span className="progress__right">{right}</span>}
      </div>
      <div className="progress__segments" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`progress__seg ${i < current ? 'progress__seg--on' : ''}`.trim()}
          />
        ))}
      </div>
    </div>
  )
}