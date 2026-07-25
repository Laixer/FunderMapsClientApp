/**
 * The app's icon set, registered once.
 *
 * `vite-svg-loader` turns each `.svg` into a Vue component, so before this
 * module every icon meant its own import in every consumer — which is why the
 * app shipped with two icons in use out of the thirty-odd sitting in
 * `assets/svg/icons`. Registering them by name lets a component ask for
 * `<Icon name="check" />` and lets `IconName` fail the build on a typo.
 *
 * Only the general-purpose set is listed. The `classification/`, `facade/`,
 * `foundation/` and `fundermaps/` subfolders are domain artwork picked by data
 * value rather than by name, and belong to whichever component maps that data.
 *
 * Everything here is a hand-drawn 16×16 glyph tinted through `currentColor`,
 * except: `validationSuccess`/`validationError` bake in their own green and red
 * (they are status marks, not neutral glyphs), and `clipboard`/`eye`/`trash`
 * come from Font Awesome with taller viewBoxes, so they letterbox inside a
 * square box instead of filling it.
 */

import AlertIcon from '@assets/svg/icons/alert.svg'
import ArrowLeftIcon from '@assets/svg/icons/arrow-left.svg'
import ArrowRightIcon from '@assets/svg/icons/arrow-right.svg'
import BellIcon from '@assets/svg/icons/bell.svg'
import ChatIcon from '@assets/svg/icons/chat.svg'
import CheckIcon from '@assets/svg/icons/check.svg'
import ChevronDownIcon from '@assets/svg/icons/chevron-down.svg'
import ChevronLeftIcon from '@assets/svg/icons/chevron-left.svg'
import ChevronRightIcon from '@assets/svg/icons/chevron-right.svg'
import ChevronUpIcon from '@assets/svg/icons/chevron-up.svg'
import ClipboardIcon from '@assets/svg/icons/clipboard-regular.svg'
import CloseIcon from '@assets/svg/icons/close.svg'
import ExitIcon from '@assets/svg/icons/exit.svg'
import EyeIcon from '@assets/svg/icons/eye-solid.svg'
import FilterIcon from '@assets/svg/icons/filter.svg'
import InfoIcon from '@assets/svg/icons/info.svg'
import LockedIcon from '@assets/svg/icons/locked.svg'
import MinusIcon from '@assets/svg/icons/minus.svg'
import PlusIcon from '@assets/svg/icons/plus.svg'
import SearchIcon from '@assets/svg/icons/search.svg'
import SwitchIcon from '@assets/svg/icons/switch.svg'
import TargetIcon from '@assets/svg/icons/target.svg'
import TrashIcon from '@assets/svg/icons/trash-solid.svg'
import UnlockedIcon from '@assets/svg/icons/unlocked.svg'
import UpDownIcon from '@assets/svg/icons/up-down.svg'
import ValidationErrorIcon from '@assets/svg/icons/validation-error.svg'
import ValidationSuccessIcon from '@assets/svg/icons/validation-success.svg'

export const ICONS = {
  alert: AlertIcon,
  arrowLeft: ArrowLeftIcon,
  arrowRight: ArrowRightIcon,
  bell: BellIcon,
  chat: ChatIcon,
  check: CheckIcon,
  chevronDown: ChevronDownIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  chevronUp: ChevronUpIcon,
  clipboard: ClipboardIcon,
  close: CloseIcon,
  exit: ExitIcon,
  eye: EyeIcon,
  filter: FilterIcon,
  info: InfoIcon,
  locked: LockedIcon,
  minus: MinusIcon,
  plus: PlusIcon,
  search: SearchIcon,
  switch: SwitchIcon,
  target: TargetIcon,
  trash: TrashIcon,
  unlocked: UnlockedIcon,
  upDown: UpDownIcon,
  validationError: ValidationErrorIcon,
  validationSuccess: ValidationSuccessIcon,
} as const

export type IconName = keyof typeof ICONS
