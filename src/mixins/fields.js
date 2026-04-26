
export default {
  // Note: this `mixin` assumes the component has `fields` set as data attribute!
  methods: {

    /**
     * Get Field Value
     *
     * <input type="number"> always returns the value as a string. The TS API
     * expects actual numbers (zod number().nullish()) — coerce based on the
     * field's declared type. Empty / null / undefined → null so the
     * "no value" case is sent explicitly rather than as NaN.
     */
    fieldValue(name) {
      const field = this.fields[name];
      const raw = field.value;
      if (field.type === "number") {
        if (raw === "" || raw === null || raw === undefined) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      }
      return raw;
    },
    fieldValues(names) {
      return names.reduce((obj, name) => {
        obj[name] = this.fieldValue(name);
        return obj
      }, {})
    },
    allFieldValues() {
      return this.fieldValues(Object.keys(this.fields))
    },

    /**
     * Set collection of field values.
     */
    setFieldValues(fieldValues) {
      if (Array.isArray(fieldValues)) {
        fieldValues.forEach(this.setFieldValue);
      } else {
        for (const key of Object.keys(fieldValues)) {
          this.setFieldValue({ name: key, value: fieldValues[key] })
        }
      }
    },

    /**
     * Set single field value.
     */
    setFieldValue({ name, value }) {
      this.fields[name].value = value;
    },

    /**
     * Clear fields
     */
    clearFieldValue({ name }) {
      // TODO: Check type (select, radio, checkbox || text, etc.)
      this.setFieldValue({ name, value: '' })
    },
    clearFieldValues(names) {
      for (const name in names) {
        this.clearFieldValueValue({ name })
      }
    },
    clearAllFieldValues() {
      this.clearFieldValues(Object.keys(this.fields))
    },

    /**
     * Field disabled state
     */
    disableField(name) {
      this.fields[name].disabled = true
    },
    enableField(name) {
      this.fields[name].disabled = false
    },
    disableFields(names) {
      for (const name of names) {
        this.disableField(name)
      }
    },
    enableFields(names) {
      for (const name of names) {
        this.enableField(name)
      }
    },
    disableAllFields() {
      this.disableFields(Object.keys(this.fields))
    },
    enableAllFields() {
      this.enableFields(Object.keys(this.fields))
    },
    toggleFieldState(name) {
      this.fields[name].disabled = !this.fields[name].disabled
    }
  }
}
