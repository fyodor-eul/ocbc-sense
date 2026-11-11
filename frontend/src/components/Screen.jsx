import './Screen.css'

export default function Screen({ header, aside, footer, children }) {
  const layout = aside ? 'flow' : 'centered'
  return (
    <div className={`screen screen--${layout}`}>
      {header}
      <div className="screen__body">
        {aside && <aside className="screen__aside">{aside}</aside>}
        <div className="screen__main">
          <main className="screen__content">{children}</main>
          {footer && <div className="screen__footer">{footer}</div>}
        </div>
      </div>
    </div>
  )
}