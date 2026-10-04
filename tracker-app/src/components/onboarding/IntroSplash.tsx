import { useCallback, useEffect, useRef, type CSSProperties } from 'react'
import { INTRO_COPY } from '../../lib/copy'
import { INTRO_MS } from '../../lib/intro'
import { ScreenBackground } from '../ui'

export interface IntroSplashProps {
  /** Called once — when the timer runs out or the user taps/presses a key. */
  onDone: () => void
  durationMs?: number
}

const delay = (ms: number) => ({ '--intro-delay': `${ms}ms` }) as CSSProperties

// The first thing a brand-new user sees: a short animated moment before the
// setup's name step. It moves on by itself after a couple of seconds, and a
// tap anywhere (or any key) skips it straight away — nobody is made to wait.
export function IntroSplash({ onDone, durationMs = INTRO_MS }: IntroSplashProps) {
  const done = useRef(false)
  const latestOnDone = useRef(onDone)
  useEffect(() => {
    latestOnDone.current = onDone
  }, [onDone])

  // Whichever comes first — timer, tap or key — and only ever once.
  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    latestOnDone.current()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(finish, durationMs)
    window.addEventListener('keydown', finish)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', finish)
    }
  }, [durationMs, finish])

  return (
    <ScreenBackground screen="generic" layout="overlay" className="z-50">
      <button
        type="button"
        onClick={finish}
        aria-label="Skip intro"
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center px-8 text-center text-text-primary"
      >
        <span
          className="intro-reveal hud-icon glow-accent animate-glow-pulse h-24 w-24 text-5xl"
          style={delay(0)}
          aria-hidden="true"
        >
          ⚔️
        </span>
        <span
          className="intro-reveal mt-8 text-[11px] font-bold tracking-[0.3em] text-accent-hover uppercase"
          style={delay(250)}
        >
          {INTRO_COPY.eyebrow}
        </span>
        <span
          className="intro-reveal hud-text-glow mt-3 text-2xl leading-tight font-black sm:text-3xl"
          style={delay(450)}
        >
          {INTRO_COPY.headline}
        </span>
        <span className="intro-reveal mt-10 text-xs text-text-secondary" style={delay(1000)}>
          Tap to continue
        </span>
      </button>
    </ScreenBackground>
  )
}
