<script setup lang="ts">
import { computed } from 'vue'

import { ICONS, type IconName } from '@/components/Common/icons'

/**
 * One icon from the registry, sized and tinted by its surroundings.
 *
 * Decorative by default: an icon that sits next to its own label is noise to a
 * screen reader, so it is `aria-hidden` unless a `label` is given — which is
 * the case when the icon carries meaning no adjacent text repeats.
 */
const props = withDefaults(
  defineProps<{
    name: IconName
    size?: 'xs' | 'sm' | 'md' | 'lg'
    /** Accessible name. Omit for icons that merely decorate nearby text. */
    label?: string
  }>(),
  { size: 'sm' },
)

const SIZES: Record<NonNullable<typeof props.size>, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const icon = computed(() => ICONS[props.name])
</script>

<template>
  <!-- `fill-current` covers the Font Awesome glyphs, whose paths carry no fill
       of their own and would otherwise render black; the hand-drawn set already
       says `currentColor` per path and is unaffected. -->
  <component
    :is="icon"
    class="inline-block shrink-0 fill-current align-[-0.125em]"
    :class="SIZES[size]"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
    focusable="false"
  />
</template>
