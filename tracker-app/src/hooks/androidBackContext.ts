import { createContext } from 'react'
import type { AndroidBackStack } from '../lib/androidBack'

export const AndroidBackContext = createContext<AndroidBackStack | null>(null)
