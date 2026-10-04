import { useEffect, useRef, useState } from 'react'

type LoadState = 'loading' | 'ready' | 'error'

// The viewer is keyed by project ID, so every newly opened project starts fresh.
export function useInitialProjectImage(source: string | undefined) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<LoadState>('loading')
  const src = source && attempt > 0
    ? `${source}${source.includes('?') ? '&' : '?'}retry=${attempt}`
    : source

  useEffect(() => {
    const image = imageRef.current
    if (!image || !src) { setState('error'); return }
    let cancelled = false
    let settled = false
    let decoding = false
    const finish = (next: LoadState) => {
      if (cancelled || settled) return
      settled = true
      clearTimeout(timeout)
      setState(next)
    }
    // A stalled request must also leave a usable retry action, not an endless spinner.
    const timeout = window.setTimeout(() => finish('error'), 45000)
    const failed = () => finish('error')
    const loaded = async () => {
      if (decoding || cancelled || settled) return
      if (!image.naturalWidth) { failed(); return }
      decoding = true
      try {
        if (image.decode) await image.decode()
        finish('ready')
      } catch { failed() }
    }
    image.addEventListener('load', loaded)
    image.addEventListener('error', failed)
    // Cached images may finish before the effect attaches its listeners.
    if (image.complete) void loaded()
    return () => {
      cancelled = true
      clearTimeout(timeout)
      image.removeEventListener('load', loaded)
      image.removeEventListener('error', failed)
    }
  }, [src])

  const retry = () => {
    setState('loading')
    setAttempt((value) => value + 1)
  }

  return { imageRef, src, state, retry }
}
