// Ported as-is from pramod-2026-tracker.html (HUNTER / LEVEL SYSTEM section).

export interface ShadowMilestone {
  level: number
  name: string
  title: string
  icon: string
  color: string
  desc: string
}

export const SHADOW_MILESTONES: ShadowMilestone[] = [
  { level: 5, name: 'Ash Wolf', title: 'Beast-class Shadow', icon: '🐺', color: '#9ca3af', desc: 'A loyal tracker, first to answer your call.' },
  { level: 10, name: 'Iron Sentinel', title: 'Knight-class Shadow', icon: '🛡️', color: '#3b82f6', desc: 'Forged from discipline. Never misses a check-in.' },
  { level: 15, name: 'Frost Reaper', title: 'Elite-class Shadow', icon: '🦇', color: '#8b5cf6', desc: 'Moves in silence. Feeds on consistency.' },
  { level: 20, name: 'Crimson General', title: 'Marshal-class Shadow', icon: '👹', color: '#f59e0b', desc: 'Commands the front line of your career grind.' },
  { level: 25, name: 'Void Serpent', title: 'Elite-class Shadow', icon: '🐉', color: '#10b981', desc: 'Coils around bad habits until they break.' },
  { level: 30, name: 'Bone Monarch', title: 'Monarch-class Shadow', icon: '💀', color: '#ef4444', desc: 'A ruler among your ranks. Feared, obeyed.' },
  { level: 40, name: 'Storm Wraith', title: 'Monarch-class Shadow', icon: '🌩️', color: '#06b6d4', desc: 'Born from momentum. Impossible to outrun.' },
  { level: 50, name: 'Obsidian Sovereign', title: 'Sovereign-class Shadow', icon: '👑', color: '#facc15', desc: 'National-level power. The grind made flesh.' },
  { level: 75, name: 'Eclipse Beast', title: 'Sovereign-class Shadow', icon: '🌑', color: '#7c3aed', desc: 'Blots out doubt wherever it stands.' },
  { level: 100, name: 'The Shadow Monarch', title: '???', icon: '🖤', color: '#a78bfa', desc: 'There is no rank above this. Only legend.' },
]
