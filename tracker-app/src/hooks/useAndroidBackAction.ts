import { useContext, useEffect, useRef } from 'react'
import { AndroidBackContext } from './androidBackContext'

export const useAndroidBackAction = (
  enabled: boolean,
  onBack: () => boolean | void,
  priority = 100,
) => {
  const stack = useContext(AndroidBackContext)
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    if (!stack || !enabled) return
    return stack.register({
      priority,
      run: () => onBackRef.current(),
    })
  }, [enabled, priority, stack])
}
