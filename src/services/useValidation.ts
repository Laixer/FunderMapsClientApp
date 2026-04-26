/**
 * Zod-driven form validation composable.
 * Adapted from https://dev.to/kouts/a-simple-vue-form-validation-composable-with-zod-38m8
 */

import { type ZodTypeAny, z } from 'zod'
import { get, groupBy } from 'lodash-es'
import { ref, watch, computed, toValue, type MaybeRefOrGetter } from 'vue'

export default function <T extends ZodTypeAny>(
  schema: T,
  data: MaybeRefOrGetter<Record<string, unknown>>,
  options?: { mode: 'eager' | 'lazy' },
) {
  const opts = Object.assign({}, { mode: 'lazy' }, options)

  const isValid = ref(true)
  const errors = ref<Record<string, z.ZodIssue[]> | null>(null)
  const hasRun = ref(false)

  const clearErrors = () => {
    errors.value = null
  }

  const unwatch = ref<null | (() => void)>(null)
  const validationWatch = () => {
    if (unwatch.value !== null) return
    unwatch.value = watch(
      () => toValue(data),
      async () => {
        await validate()
      },
      { deep: true },
    )
  }
  const activate = validationWatch

  const deactivate = () => {
    if (unwatch.value) {
      unwatch.value()
      unwatch.value = null
    }
  }

  const isActive = computed<boolean>(() => unwatch.value !== null)

  const validate = async () => {
    clearErrors()
    const result = await schema.safeParseAsync(toValue(data))
    isValid.value = result.success
    hasRun.value = true
    if (!result.success) {
      errors.value = groupBy(result.error.issues, 'path')
      validationWatch()
    }
    return errors
  }

  const scrolltoError = (selector = '.is-error', options = { offset: 0 }) => {
    const element = document.querySelector(selector)
    if (element) {
      const topOffset =
        element.getBoundingClientRect().top -
        document.body.getBoundingClientRect().top -
        options.offset
      window.scrollTo({ behavior: 'smooth', top: topOffset })
    }
  }

  const getError = (path: string): string | undefined =>
    get(errors.value, `${path.replaceAll('.', ',')}.0.message`) as string | undefined

  const getStatus = (path: string) => {
    if (hasRun.value === false) return 'none'
    return get(errors.value, `${path.replaceAll('.', ',')}.0.message`) ? 'error' : 'success'
  }

  const reset = () => {
    deactivate()
    clearErrors()
    isValid.value = true
    hasRun.value = false
  }

  if (opts.mode === 'eager') validationWatch()

  return {
    validate,
    errors,
    isValid,
    isActive,
    deactivate,
    activate,
    reset,
    getStatus,
    clearErrors,
    getError,
    scrolltoError,
  }
}
