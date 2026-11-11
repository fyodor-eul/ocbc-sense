import './Button.css'
import Spinner from './Spinner'

export default function Button({
  variant = 'primary',
  fullWidth = true,
  loading = false,
  disabled = false,
  type = 'button',
  children,
  ...rest
}) {
  const classes = ['btn', `btn--${variant}`, fullWidth ? 'btn--full' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner small />}
      {children}
    </button>
  )
}