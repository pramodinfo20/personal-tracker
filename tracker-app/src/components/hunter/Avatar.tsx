import { cn } from '../../lib/cn'
import { isAvatarDataUrl } from '../../lib/avatar'
import { avatarInitial } from '../../lib/profile'

export interface AvatarProps {
  name: string
  /** Hunter.photo — the letter avatar is used when absent (or not a valid photo). */
  photo?: string
  /** Size and letter styling, e.g. "h-10 w-10 text-lg". */
  className?: string
}

// The round hunter avatar, everywhere it appears: the saved photo when
// there is one, otherwise the first letter of the name. Decorative — the
// name is always shown or labelled next to it by the caller.
export function Avatar({ name, photo, className }: AvatarProps) {
  const hasPhoto = isAvatarDataUrl(photo)
  return (
    <span
      aria-hidden="true"
      className={cn('hud-icon overflow-hidden font-extrabold text-text-primary', className)}
    >
      {hasPhoto ? (
        <img src={photo} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        avatarInitial(name)
      )}
    </span>
  )
}
