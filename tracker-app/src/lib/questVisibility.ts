// Which quests show on Today. One list, one filter, for both kinds:
//   - fixed DAILY_QUESTS: enabled unless their id is in hunter.hiddenQuestIds
//   - custom quests: enabled when their own `active` flag is set
// Today renders visibleQuests(...); Manage Quests renders every entry with a
// toggle. This is purely a display filter — claimQuest/undoQuestClaim don't
// know or care about it.

import { customQuestToClaimable, type CustomQuest } from './customQuests'
import { DAILY_QUESTS, type ClaimableQuest } from './quests'

export interface QuestEntry {
  quest: ClaimableQuest
  kind: 'fixed' | 'custom'
  enabled: boolean
}

// hiddenQuestIds is undefined on saves from before this existed — that
// reads as "nothing hidden", so existing hunters see all 5 as before.
export const questEntries = (
  hiddenQuestIds: string[] | undefined,
  customQuests: CustomQuest[],
): QuestEntry[] => {
  const hidden = new Set(hiddenQuestIds ?? [])
  return [
    ...DAILY_QUESTS.map(
      (quest): QuestEntry => ({ quest, kind: 'fixed', enabled: !hidden.has(quest.id) }),
    ),
    ...customQuests.map(
      (c): QuestEntry => ({ quest: customQuestToClaimable(c), kind: 'custom', enabled: c.active }),
    ),
  ]
}

export const visibleQuests = (entries: QuestEntry[]): QuestEntry[] =>
  entries.filter((e) => e.enabled)

// Next hiddenQuestIds after toggling one fixed quest. Ignores ids that
// aren't fixed quests (custom quests toggle via their own `active`), and
// never stores duplicates.
export const toggleHiddenQuest = (
  hiddenQuestIds: string[] | undefined,
  questId: string,
  enabled: boolean,
): string[] => {
  const current = hiddenQuestIds ?? []
  if (!DAILY_QUESTS.some((q) => q.id === questId)) return current
  const without = current.filter((id) => id !== questId)
  return enabled ? without : [...without, questId]
}
