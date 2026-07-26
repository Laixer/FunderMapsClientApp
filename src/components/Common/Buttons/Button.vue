<script setup lang="ts">
import { computed } from 'vue'

import { keyLabel } from '@/services/shortcuts'

/**
 * The studio's button.
 *
 * Four variants, and the interesting one is `danger`: a white button with red
 * text and a red-tinted border, not a filled red block. "Verwijderen" sits next
 * to "Aanbieden ter review" in the dossier header, and a solid red slab there
 * would out-shout the action people actually came to perform. Destructive is
 * marked, not amplified.
 *
 * Every button is 32px tall to match the fields, so a form's action row lines
 * up with the controls above it.
 */
const props = withDefaults(
  defineProps<{
    label?: string
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    disabled?: boolean
    /** Mono keyboard hint rendered inside the button, e.g. `⌘↵`. */
    shortcut?: string
    /** Stretch to the container — for a dropzone action or an inspector button. */
    block?: boolean
  }>(),
  { type: 'button', variant: 'secondary', disabled: false, block: false },
)

const VARIANTS = {
  primary:
    'bg-green border-green-hover text-white hover:bg-green-hover disabled:bg-line-hover disabled:border-line-hover',
  secondary:
    'bg-surface border-line-strong text-strong hover:border-line-hover disabled:text-label disabled:hover:border-line-strong',
  danger: 'bg-surface border-red-border text-red hover:bg-red-wash disabled:text-label',
  ghost:
    'bg-transparent border-transparent text-muted hover:bg-sunken hover:text-strong disabled:text-label',
} as const

/**
 * `shrink-0` is the default so a button in a crowded header row keeps its label
 * on one line. `block` is the deliberate exception — it shares the row with a
 * sibling (the inspector's "Dossier openen" + "Invoer" pair), where refusing to
 * shrink is what pushed the second button off a 380px pane. The two are
 * mutually exclusive rather than layered, so neither depends on which utility
 * happens to come later in the stylesheet.
 */
const classes = computed(() => [
  VARIANTS[props.variant],
  props.block ? 'min-w-0 flex-1 justify-center' : 'shrink-0',
])

/** Bindings are written the Mac way in code; this is where they meet a keyboard. */
const shortcutLabel = computed(() => (props.shortcut ? keyLabel(props.shortcut) : null))
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="text-md inline-flex h-8 items-center gap-2 rounded-lg border px-3 font-semibold whitespace-nowrap disabled:cursor-default"
    :class="classes"
  >
    <slot name="before" />
    <slot>{{ label }}</slot>
    <!-- The shortcut rides inside the button rather than in a tooltip: an
         accelerator nobody can see is an accelerator nobody learns. -->
    <span v-if="shortcutLabel" class="text-2xs font-mono opacity-70" aria-hidden="true">
      {{ shortcutLabel }}
    </span>
    <slot name="after" />
  </button>
</template>
