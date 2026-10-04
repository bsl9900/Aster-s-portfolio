import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { contactDetails, type ContactAction } from './contact.data'

type ModalKind = Exclude<ContactAction, 'reaction'>
type OrientationControl = ScreenOrientation & { lock?: (orientation: string) => Promise<void> }
type AppleVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void; webkitExitFullscreen?: () => void }

function MotionPlayer({ onClose }: { onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const video = useRef<AppleVideo>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [error, setError] = useState(false)
  const [mobileFullscreen, setMobileFullscreen] = useState(() => window.matchMedia('(max-width: 700px)').matches)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  const orientationLocked = useRef(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)')
    const update = () => setMobileFullscreen(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const element = video.current
    const container = root.current
    const orientation = screen.orientation as OrientationControl | undefined
    const update = () => {
      const isFull = document.fullscreenElement === container
      setFullscreen(isFull)
      if (!isFull && orientationLocked.current) { orientation?.unlock(); orientationLocked.current = false }
    }
    const appleStart = () => setFullscreen(true)
    const appleEnd = () => setFullscreen(false)
    document.addEventListener('fullscreenchange', update)
    element?.addEventListener('webkitbeginfullscreen', appleStart)
    element?.addEventListener('webkitendfullscreen', appleEnd)
    return () => {
      document.removeEventListener('fullscreenchange', update)
      element?.removeEventListener('webkitbeginfullscreen', appleStart)
      element?.removeEventListener('webkitendfullscreen', appleEnd)
      element?.pause()
      if (container && document.fullscreenElement === container) void document.exitFullscreen().catch(() => {})
      try { element?.webkitExitFullscreen?.() } catch { /* Already exited the native player. */ }
      if (orientationLocked.current) orientation?.unlock()
    }
  }, [])

  const enterFullscreen = async () => {
    if (!mobileFullscreen) return
    if (document.fullscreenElement) { await document.exitFullscreen(); return }
    if (root.current?.requestFullscreen) {
      try {
        await root.current.requestFullscreen()
        const orientation = screen.orientation as OrientationControl | undefined
        if (window.matchMedia('(pointer: coarse)').matches && orientation?.lock) {
          try { await orientation.lock('landscape'); orientationLocked.current = true } catch { /* Optional on supported devices only. */ }
        }
      } catch { try { video.current?.webkitEnterFullscreen?.() } catch { /* Native playback remains available. */ } }
    } else { try { video.current?.webkitEnterFullscreen?.() } catch { /* Native playback remains available. */ } }
  }

  return <div className="contact-modal__player" ref={root}>
    <video ref={video} controls={mobileFullscreen} controlsList={mobileFullscreen ? undefined : 'nofullscreen'} playsInline preload="metadata" src={contactDetails.motion}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={event => setTime(event.currentTarget.currentTime)}
      onLoadedMetadata={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onVolumeChange={event => setVolume(event.currentTarget.muted ? 0 : event.currentTarget.volume)}
      onError={() => setError(true)} aria-label="心遇 APP AE 动效视频" />
    {!mobileFullscreen && <div className="contact-modal__desktop-controls">
      <button type="button" onClick={() => { if (video.current?.paused) void video.current.play().catch(() => setError(true)); else video.current?.pause() }}>{playing ? '暂停' : '播放'}</button>
      <input className="contact-modal__progress" type="range" aria-label="视频播放进度" min="0" max={duration || 1} step="0.1" value={time} onChange={event => { if (video.current) video.current.currentTime = Number(event.target.value) }} />
      <span className="contact-modal__time">{formatTime(time)} / {formatTime(duration)}</span>
      <input className="contact-modal__volume" type="range" aria-label="视频音量" min="0" max="1" step="0.05" value={volume} onChange={event => { if (video.current) { video.current.muted = false; video.current.volume = Number(event.target.value) } }} />
    </div>}
    <div className="contact-modal__player-bar">
      <span>心遇 / AE MOTION</span>
      {fullscreen && <button type="button" onClick={onClose} aria-label="关闭全屏视频">关闭 ×</button>}
      {mobileFullscreen && <button type="button" onClick={() => void enterFullscreen()}>{fullscreen ? '退出全屏' : '全屏观看 ↗'}</button>}
    </div>
    <p className={`contact-modal__orientation${fullscreen ? ' is-fullscreen' : ''}`}>横屏观看效果更佳</p>
    {error && <p role="alert">视频暂时无法播放，请检查网络后重试。</p>}
  </div>
}

export function ContactModal({ kind, onClose }: { kind: ModalKind; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const copyTimer = useRef(0)
  const [copyStatus, setCopyStatus] = useState('')
  const title = { resume: '个人简历', contact: '联系 Aster', motion: 'AE Motion / 心遇' }[kind]

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    const main = document.querySelector('main')
    const wasInert = main?.inert ?? false
    if (main) main.inert = true
    document.body.style.overflow = 'hidden'
    window.dispatchEvent(new CustomEvent('portfolio:modal-visibility', { detail: { visible: true } }))
    close.current?.focus({ preventScroll: true })
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key !== 'Tab') return
      const focusable = Array.from((document.fullscreenElement ?? panel.current)?.querySelectorAll<HTMLElement>('button, a[href], video[controls], input, [tabindex="0"]') ?? [])
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keyboard)
    return () => {
      clearTimeout(copyTimer.current)
      document.removeEventListener('keydown', keyboard)
      document.body.style.overflow = overflow
      if (main) main.inert = wasInert
      window.dispatchEvent(new CustomEvent('portfolio:modal-visibility', { detail: { visible: false } }))
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [onClose])

  const copy = async (value: string, label: string) => {
    let success = false
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); success = true }
    } catch { /* LAN HTTP and browsers without clipboard permission use the selection fallback. */ }
    if (!success) {
      const input = document.createElement('textarea')
      input.value = value
      input.style.cssText = 'position:fixed;opacity:0;inset:0;pointer-events:none'
      panel.current?.append(input)
      input.select()
      try { success = document.execCommand('copy') } catch { success = false }
      input.remove()
    }
    setCopyStatus(success ? `${label} · Copied` : '请长按上方文字复制')
    clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopyStatus(''), 2200)
  }

  return createPortal(<div className="contact-modal" onWheel={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
    <div className="contact-modal__backdrop" onClick={onClose} aria-hidden="true" />
    <div className={`contact-modal__panel contact-modal__panel--${kind}`} ref={panel} role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
      <header className="contact-modal__header"><h2 id="contact-modal-title">{title}</h2><button className="contact-modal__close" ref={close} type="button" onClick={onClose} aria-label="关闭 Contact 弹窗">×</button></header>
      <div className="contact-modal__body">
        {kind === 'resume' && <><img className="contact-modal__resume" src={contactDetails.resume} alt="刘亦芳菲的个人简历" /><a className="contact-modal__download" href={contactDetails.resume} download="刘亦芳菲-简历.jpg">下载简历 JPG ↓</a></>}
        {kind === 'contact' && <div className="contact-modal__card">
          <p className="contact-modal__kicker">LET’S KEEP IN TOUCH</p>
          <img className="contact-modal__qr" src={contactDetails.qr} alt="Aster 微信二维码，可扫码或长按保存" />
          <p className="contact-modal__scan">扫码添加微信 · 期待和你聊聊</p>
          <dl>{[['WeChat', contactDetails.wechat], ['Email', contactDetails.email]].map(([label, value]) => <div className="contact-modal__detail" key={label}><dt>{label}</dt><dd>{value}</dd><button type="button" aria-label={`复制${label}`} onClick={() => void copy(value, label)}>复制</button></div>)}</dl>
          <p className="contact-modal__copy-status" role="status">{copyStatus}</p>
          <a className="contact-modal__email" href={`mailto:${contactDetails.email}`}>发送邮件 ↗</a>
        </div>}
        {kind === 'motion' && <MotionPlayer onClose={onClose} />}
      </div>
    </div>
  </div>, document.body)
}
