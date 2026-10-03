// The <ScreenBackground> props for a screen in the active theme — the one
// place screens ask "which art do I show right now?".

import { screenBackgroundProps, type ScreenBackgroundKey } from '../lib/screenBackgrounds'
import { useTheme } from './useTheme'

export const useScreenBackground = (key: ScreenBackgroundKey) =>
  screenBackgroundProps(key, useTheme().resolved)
