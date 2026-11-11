import './Spinner.css'

export default function Spinner({ small = false }) {
  return <span className={`spinner ${small ? 'spinner--small' : ''}`.trim()} aria-hidden="true" />
}