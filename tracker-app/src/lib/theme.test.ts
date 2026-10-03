/// <reference types="node" />
// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import {
  THEME_COLOR,
  THEME_STORAGE_KEY,
  applyTheme,
  isThemePreference,
  resolveTheme,
} from './theme'

// The real files on disk (not Vite-processed): tests run from the app root.
const html = readFileSync('index.html', 'utf8')
const css = readFileSync('src/index.css', 'utf8')

describe('resolveTheme', () => {
  it("'system' follows the device preference", () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('an explicit choice overrides the device preference', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('isThemePreference', () => {
  it('accepts only the three known values', () => {
    expect(['system', 'light', 'dark'].every(isThemePreference)).toBe(true)
    expect(isThemePreference('sepia')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })
})

describe('applyTheme', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme
    document.head.innerHTML = ''
  })

  it('sets data-theme on <html> and the browser theme-color', () => {
    document.head.innerHTML = '<meta name="theme-color" content="#000000">'
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]')!.getAttribute('content')).toBe(
      THEME_COLOR.light,
    )
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.querySelector('meta[name="theme-color"]')!.getAttribute('content')).toBe(
      THEME_COLOR.dark,
    )
  })

  it('works without a theme-color meta', () => {
    expect(() => applyTheme('light')).not.toThrow()
  })
})

// index.html carries an inline pre-paint copy of this logic and index.css
// carries the colors; these keep the three in step.
describe('theme sources stay in sync', () => {
  it('the inline script in index.html uses the same storage key and theme-colors', () => {
    expect(html).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`)
    expect(html).toContain(THEME_COLOR.dark)
    expect(html).toContain(THEME_COLOR.light)
    expect(html).toContain("'(prefers-color-scheme: dark)'")
  })

  it('theme-color matches --color-bg in each theme', () => {
    const darkBg = css.match(/@theme \{[\s\S]*?--color-bg: (#[0-9a-f]{6});/i)![1]
    const lightBg = css.match(/\[data-theme='light'\] \{[\s\S]*?--color-bg: (#[0-9a-f]{6});/i)![1]
    expect(THEME_COLOR.dark).toBe(darkBg)
    expect(THEME_COLOR.light).toBe(lightBg)
  })

  it('the light theme overrides every RGB source the dark theme defines', () => {
    const block = (re: RegExp) => css.match(re)![0]
    const names = (b: string) => [...b.matchAll(/(--rgb-[a-z-]+):/g)].map((m) => m[1]).sort()
    const dark = names(block(/:root \{[\s\S]*?\n\}/))
    const light = names(block(/\[data-theme='light'\] \{[\s\S]*?\n\}/))
    expect(dark.length).toBeGreaterThan(15)
    expect(light).toEqual(dark)
  })
})

// WCAG contrast of the solid-surface text tokens, computed from index.css —
// the same AA bar used for text over the screen art.
describe('text tokens meet WCAG AA on their theme background', () => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }
  const token = (block: string, name: string) =>
    block.match(new RegExp(`${name}: (#[0-9a-f]{6});`, 'i'))![1]
  const dark = css.match(/@theme \{[\s\S]*?\n\}/)![0]
  const light = css.match(/\[data-theme='light'\] \{[\s\S]*?\n\}/)![0]

  it.each([
    ['dark', dark],
    ['light', light],
  ])('%s: primary, secondary and muted text are all >= 4.5:1 on bg and on surface', (_name, block) => {
    for (const surface of ['--color-bg', '--color-surface']) {
      for (const text of ['--color-text-primary', '--color-text-secondary', '--color-text-muted']) {
        expect(ratio(token(block, text), token(block, surface))).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  // Accent / tier / semantic colors are used as TEXT; on the light theme they
  // must be dark enough to read on a light surface.
  it('light: accent, tier and semantic colors are >= 4.5:1 as text on the light background', () => {
    const bg = token(light, '--color-bg')
    const toHex = (triple: string) =>
      '#' + triple.split(' ').map((n) => Number(n).toString(16).padStart(2, '0')).join('')
    for (const name of ['accent', 'accent-hover', 'bronze', 'silver', 'gold', 'purple', 'red', 'success', 'warning', 'danger', 'stat-str', 'stat-vit', 'stat-int', 'stat-per', 'stat-agi']) {
      const triple = light.match(new RegExp(`--rgb-${name}: (\\d+ \\d+ \\d+);`))![1]
      expect([name, ratio(toHex(triple), bg) >= 4.5]).toEqual([name, true])
    }
  })
})
