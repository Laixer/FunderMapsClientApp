<template>
  <div class="Sample">
    <SampleLine 
      :address="address"
      :open="open"
      :editMode="editMode"
      @save="handleSave"
      @delete="handleDelete"
      @toggle="handleToggle" />
    <div 
      v-if="open"
      class="Sample__details">
      <SampleDataEditor 
        v-if="editMode"
        :sample="sample" />
      <SampleDataPresentation 
        v-if="!editMode"
        :sample="sample" />
    </div>
  </div>
</template>

<script>
import SampleLine from 'molecule/SampleLine'
import SampleDataPresentation from 'molecule/SampleDataPresentation'
import SampleDataEditor from 'organism/SampleDataEditor'

export default {
  components: {
    SampleLine, SampleDataPresentation, SampleDataEditor
  },
  props: {
    sample: {
      type: Object,
      required: true,
    },
    editMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      open: false
    }
  },
  computed: {
    classList() {
      return {
        'SampleLine--open': true
      }
    },
    address() { 
      let address = this.sample.address;
      return ['street_name', 'building_number', 'building_number_suffix']
        .reduce((addr, key) => {
          return address[key] ? addr + ' ' + address[key] : addr;
        }, '')
        .trim();
    }
  },
  methods: {
    handleToggle() {
      this.open = ! this.open;
    },
    handleSave() {
      // console.log("save")
    },
    handleDelete() {
      // console.log("delete")
    }
  }
}
</script>

<style lang="scss">
.Sample {
  border: 1px solid #CED0DA;
  background-color: white;
  border-radius: 5px;
  margin-top: 10px;
  overflow: hidden;

  &__details {
    position: relative;
    background: #FAFBFC;
    border-top: 1px solid #CED0DA;

    &:after {
      position: absolute;
      content: '';
      top: -7px;
      left: 54px;
      width: 12px;
      height: 12px;
      border-top: 1px solid #CED0DA;
      border-right: 1px solid #CED0DA;
      background: #FAFBFC;
      transform: rotate(-45deg)
    }
  }
}
</style>