// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEVTOOLS_UNLOCK_KEY,
  applyDevToolsParam,
  devToolsEnabledFor,
  isDevToolsEnabled,
  isDevToolsUnlocked,
} from './devToolsGate'

afterEach(() => localStorage.clear())

describe('devToolsEnabledFor — the gate rule', () => {
  it('a dev build: enabled, whatever the flag or unlock state', () => {
    expect(devToolsEnabledFor({ dev: true, flag: undefined }, false)).toBe(true)
    expect(devToolsEnabledFor({ dev: true, flag: 'false' }, false)).toBe(true)
  })

  it('production without the env flag: disabled — even in an unlocked browser', () => {
    expect(devToolsEnabledFor({ dev: false, flag: undefined }, false)).toBe(false)
    expect(devToolsEnabledFor({ dev: false, flag: undefined }, true)).toBe(false)
  })

  it('production with the env flag but NOT unlocked: disabled', () => {
    expect(devToolsEnabledFor({ dev: false, flag: 'true' }, false)).toBe(false)
  })

  it('production with the env flag AND unlocked: enabled', () => {
    expect(devToolsEnabledFor({ dev: false, flag: 'true' }, true)).toBe(true)
  })

  it('only the exact string "true" counts as the flag being on', () => {
    for (const flag of ['false', '1', 'TRUE', 'yes', '', ' true']) {
      expect(devToolsEnabledFor({ dev: false, flag }, true), JSON.stringify(flag)).toBe(false)
    }
  })
})

describe('unlock flag', () => {
  it('is off until set to "1"', () => {
    expect(isDevToolsUnlocked()).toBe(false)
    localStorage.setItem(DEVTOOLS_UNLOCK_KEY, 'yes')
    expect(isDevToolsUnlocked()).toBe(false)
    localStorage.setItem(DEVTOOLS_UNLOCK_KEY, '1')
    expect(isDevToolsUnlocked()).toBe(true)
  })

  it('is device-local: not one of the backed-up save keys', () => {
    expect(DEVTOOLS_UNLOCK_KEY).toBe('hunter.devtoolsUnlocked')
    expect(DEVTOOLS_UNLOCK_KEY.startsWith('p26_')).toBe(false)
  })

  it('reads as locked if storage throws', () => {
    expect(
      isDevToolsUnlocked({
        getItem: () => {
          throw new Error('blocked')
        },
      }),
    ).toBe(false)
  })

  it('in this (dev/test) build the tools are enabled', () => {
    expect(isDevToolsEnabled()).toBe(true)
  })
})

describe('applyDevToolsParam — ?devtools=1 / ?devtools=0', () => {
  const run = (href: string) => {
    const replaceState = vi.fn()
    const result = applyDevToolsParam({ href }, { replaceState }, localStorage)
    return { result, replaceState }
  }

  it('?devtools=1 unlocks this browser and strips the parameter', () => {
    const { result, replaceState } = run('https://tracker.example.com/?devtools=1')
    expect(result).toBe('unlocked')
    expect(localStorage.getItem(DEVTOOLS_UNLOCK_KEY)).toBe('1')
    expect(replaceState).toHaveBeenCalledWith(null, '', '/')
  })

  it('?devtools=0 locks it again', () => {
    localStorage.setItem(DEVTOOLS_UNLOCK_KEY, '1')
    const { result, replaceState } = run('https://tracker.example.com/?devtools=0')
    expect(result).toBe('locked')
    expect(localStorage.getItem(DEVTOOLS_UNLOCK_KEY)).toBeNull()
    expect(replaceState).toHaveBeenCalledWith(null, '', '/')
  })

  it('keeps the path, other parameters and the hash', () => {
    const { replaceState } = run('https://tracker.example.com/app/?a=1&devtools=1&b=2#top')
    expect(replaceState).toHaveBeenCalledWith(null, '', '/app/?a=1&b=2#top')
  })

  it('without the parameter nothing happens', () => {
    const { result, replaceState } = run('https://tracker.example.com/?other=1')
    expect(result).toBeNull()
    expect(replaceState).not.toHaveBeenCalled()
    expect(localStorage.getItem(DEVTOOLS_UNLOCK_KEY)).toBeNull()
  })

  it('any other value is ignored: no unlock, address left alone', () => {
    for (const value of ['true', '2', '', 'yes']) {
      const { result, replaceState } = run(`https://tracker.example.com/?devtools=${value}`)
      expect(result).toBeNull()
      expect(replaceState).not.toHaveBeenCalled()
    }
    expect(localStorage.getItem(DEVTOOLS_UNLOCK_KEY)).toBeNull()
  })

  it('unlocking alone does not enable anything in a build without the flag', () => {
    run('https://tracker.example.com/?devtools=1')
    expect(devToolsEnabledFor({ dev: false, flag: undefined }, isDevToolsUnlocked())).toBe(false)
    expect(devToolsEnabledFor({ dev: false, flag: 'true' }, isDevToolsUnlocked())).toBe(true)
  })
})
