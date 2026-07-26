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
