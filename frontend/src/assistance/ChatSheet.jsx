import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Info } from 'lucide-react'
import Button from '../components/Button'
import { suggestedQuestions } from '../data/answers'
import useT from '../i18n/useT'

export default function ChatSheet({ title, pageId, messages, asking, canStaff, onAsk, onRate, onDecide, onStaff }) {
  const { t, lang } = useT()
  const [text, setText] = useState('')
  const endRef = useRef(null)
  const asked = new Set(messages.filter((m) => m.from === 'user').map((m) => m.text))
  const chips = suggestedQuestions(pageId, lang).filter((q) => !asked.has(q))

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages, asking])

  function send(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAsk(text)
    setText('')
  }

  return (
    <div className="chat">
      {title && (
        <p className="chat__context">
          <Info size={14} aria-hidden="true" /> {t('chat.context', { title })}
        </p>
      )}
      <div className="chat__log" role="log" aria-live="polite">
        {messages.length === 0 && <p className="chat__empty">{t('chat.empty')}</p>}
        {messages.map((m) =>
          m.from === 'user' ? (
            <div key={m.id} className="msg msg--user">
              <p className="msg__bubble">{m.text}</p>
              <span className="msg__time">{m.time}</span>
            </div>
          ) : (
            <div key={m.id} className="msg msg--bot">
              <span className="msg__who">OCBC Sense</span>
              <p className="msg__bubble">{m.text}</p>
              <span className="msg__time">{m.time}</span>
              {m.suggestion && m.suggestion.decided === null && (
                <div className="msg__rate">
                  <Button variant="secondary" fullWidth={false} onClick={() => onDecide(m.id, true)}>{t('chat.suggest.yes')}</Button>
                  <Button variant="tertiary" fullWidth={false} onClick={() => onDecide(m.id, false)}>{t('chat.suggest.no')}</Button>
                </div>
              )}
              {m.suggestion?.decided === 'yes' && <span className="msg__time">{t('chat.suggest.done')}</span>}
              {m.suggestion?.decided === 'no' && <span className="msg__time">{t('chat.suggest.kept')}</span>}
              {canStaff && (m.fallback || m.refused) && m.feedback === null && (
                <Button variant="secondary" fullWidth={false} onClick={onStaff}>{t('common.staff')}</Button>
              )}
              {!m.fallback && !m.refused && m.feedback === null && (
                <div className="msg__rate">
                  <Button variant="secondary" fullWidth={false} onClick={() => onRate(m.id, 'helped')}>{t('chat.rate.helped')}</Button>
                  {canStaff ? (
                    <Button variant="tertiary" fullWidth={false} onClick={() => onRate(m.id, 'not_helped')}>
                      {t('chat.rate.stuck.staff')}
                    </Button>
                  ) : (
                    <Button variant="tertiary" fullWidth={false} onClick={() => onRate(m.id, 'not_helped')}>{t('chat.rate.stuck')}</Button>
                  )}
                </div>
              )}
              {m.feedback === 'helped' && <span className="msg__time">{t('chat.glad')}</span>}
            </div>
          )
        )}
        {asking && <p className="chat__typing" role="status">{t('chat.typing')}</p>}
        <div ref={endRef} />
      </div>

      {chips.length > 0 && (
        <div className="chat__chips">
          {chips.map((q) => (
            <button key={q} type="button" className="chip" onClick={() => onAsk(q)} disabled={asking}>{q}</button>
          ))}
        </div>
      )}

      <form className="chat__form" onSubmit={send}>
        <input
          className="chat__input"
          value={text}
          maxLength={300}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('chat.placeholder')}
          aria-label={t('chat.placeholder')}
        />
        <button className="chat__send" type="submit" aria-label={t('chat.send')} disabled={!text.trim() || asking}>
          <ArrowUp size={20} aria-hidden="true" />
        </button>
      </form>
      <p className="step__caption">{t('chat.caption')}</p>
    </div>
  )
}
