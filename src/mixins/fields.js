
export default {
  // Note: this `mixin` assumes the component has `fields` set as data attribute!
  methods: {
    fieldValue(name) {
      return this.fields[name].value;
    },
    fieldValues(names) {
      return names.reduce((obj, name) => { 
        obj[name] = this.fields[name].value; 
        return obj
      }, {})
    },
    allFieldValues() {
      return this.fieldValues(Object.keys(this.fields))
    },
    toggleFieldState(name) {
      this.fields[name].disabled = !this.fields[name].disabled
    },
    disableField(name) {
      this.fields[name].disabled = true
    },
    enableField(name) {
      this.fields[name].disabled = false
    },
    disableFields(names) {
      names.forEach(name => this.disableField(name))
    },
    enableFields(names) {
      names.forEach(name => this.enableField(name))
    },
    disableAllFields() {
      this.disableFields(Object.keys(this.fields))
    },
    enableAllFields() {
      this.enableFields(Object.keys(this.fields))
    }
  }
}