import { useCallback, useEffect, useState } from 'react'

export default function useCountdown(start) {
  const [left, setLeft] = useState(start)

  useEffect(() => {
    if (left <= 0) return undefined
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])

  const restart = useCallback(() => setLeft(start), [start])
  return [left, restart]
}