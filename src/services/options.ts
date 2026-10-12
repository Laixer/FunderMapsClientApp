/**
 * The shape of a choice.
 *
 * Lives in its own module rather than on the component that renders it, so the
 * enum tables in `inquiryEnums` / `recoveryEnums` / `sampleEnums` can describe
 * their options without importing a `.vue` file — those tables are also read by
 * the read-only views, the reviewer overview and the CSV-facing label helpers,
 * none of which render a control.
 */
export interface SelectOption {
  value: string | number | boolean | null
  label: string
}

/**
 * A list of named things in the order a person looks for one: by name, the
 * Dutch way. The 109 uitvoerders came in the order they were created.
 */
export function byName<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }))
}
