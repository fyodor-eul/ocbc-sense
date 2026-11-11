import { Check } from 'lucide-react'
import './StepList.css'
import useT from '../i18n/useT'

export default function StepList({ steps, current }) {
  const { t } = useT()
  return (
    <nav className="step-list" aria-label={t('step.list')}>
      <ol>
        {steps.map((title, i) => {
          const n = i + 1
          const state = n < current ? 'done' : n === current ? 'current' : 'todo'
          return (
            <li
              key={n}
              className={`step-list__item step-list__item--${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="step-list__num">
                {state === 'done' ? <Check size={16} aria-hidden="true" /> : n}
              </span>
              <span className="step-list__title">{title}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}