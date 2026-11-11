import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Clock, Headset, CircleCheck, CircleAlert } from 'lucide-react'
import Button from '../components/Button'
import useT from '../i18n/useT'

export default function StaffSheet({ staff, onReply, onCancel, onClose }) {
  const { t } = useT()
  const { status, position, messages, staffName } = staff
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages])

  // The message appears in the chat when the server sends it back (saved, ID numbers hidden).
  async function send(e) {
    e.preventDefault()
    const value = text.trim()
    if (!value || sending) return
    setSending(true)
    const ok = await onReply(value)
    setSending(false)
    if (ok) setText('')
  }

  return (
    <div className="chat">
      <div className="staff__state" role="status">
        <span className={`sheet__icon ${status === 'waiting' || status === 'failed' ? 'sheet__icon--red' : 'sheet__icon--green'}`} aria-hidden="true">
          {status === 'waiting' && <Clock size={22} />}
          {status === 'joined' && <Headset size={22} />}
          {status === 'resolved' && <CircleCheck size={22} />}
          {status === 'failed' && <CircleAlert size={22} />}
        </span>
        <span className="sheet__text">
          <span className="sheet__title">
            {status === 'waiting' && (position <= 1 ? t('staff.next') : t('staff.position', { n: position }))}
            {status === 'joined' && (staffName ? t('staff.joined.name', { name: staffName }) : t('staff.joined'))}
            {status === 'resolved' && t('staff.done')}
            {status === 'failed' && t('staff.failed')}
          </span>
          <span className="sheet__sub">
            {status === 'waiting' && t('staff.waiting')}
            {status === 'joined' && t('staff.joined.sub')}
            {status === 'resolved' && t('staff.done.sub')}
            {status === 'failed' && t('staff.failed.sub')}
          </span>
        </span>
      </div>

      <div className="chat__log" role="log" aria-live="polite">
        {messages.map((m) =>
          m.from === 'user' ? (
            <div key={m.id} className="msg msg--user">
              <p className="msg__bubble">{m.text}</p>
              <span className="msg__time">{m.time}</span>
            </div>
          ) : (
            <div key={m.id} className="msg msg--bot">
              <span className="msg__who">{staffName || t('chat.who.staff')}</span>
              <p className="msg__bubble">{m.text}</p>
              <span className="msg__time">{m.time}</span>
            </div>
          )
        )}
        <div ref={endRef} />
      </div>

      {status === 'joined' && (
        <form className="chat__form" onSubmit={send}>
          <input
            className="chat__input"
            value={text}
            maxLength={300}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('staff.reply.placeholder')}
            aria-label={t('staff.reply.placeholder')}
          />
          <button className="chat__send" type="submit" aria-label={t('chat.send')} disabled={!text.trim() || sending}>
            <ArrowUp size={20} aria-hidden="true" />
          </button>
        </form>
      )}

      <div className="sheet">
        {status === 'resolved' || status === 'failed' ? (
          <Button onClick={onCancel}>{t('staff.continue')}</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>{t('staff.backToStep')}</Button>
            {status === 'waiting' && <Button variant="tertiary" onClick={onCancel}>{t('staff.cancel')}</Button>}
          </>
        )}
      </div>
    </div>
  )
}
