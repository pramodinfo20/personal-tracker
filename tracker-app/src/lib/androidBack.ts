export interface AndroidBackAction {
  id: number
  priority: number
  order: number
  run: () => boolean | void
}

export interface AndroidBackStack {
  register: (action: Omit<AndroidBackAction, 'id' | 'order'>) => () => void
  handleBack: () => boolean
  size: () => number
}

export const createAndroidBackStack = (): AndroidBackStack => {
  let nextId = 1
  let nextOrder = 1
  const actions = new Map<number, AndroidBackAction>()

  return {
    register(action) {
      const id = nextId++
      actions.set(id, { ...action, id, order: nextOrder++ })
      return () => {
        actions.delete(id)
      }
    },
    handleBack() {
      const ordered = [...actions.values()].sort(
        (a, b) => b.priority - a.priority || b.order - a.order,
      )
      for (const action of ordered) {
        if (action.run() !== false) return true
      }
      return false
    },
    size() {
      return actions.size
    },
  }
}
