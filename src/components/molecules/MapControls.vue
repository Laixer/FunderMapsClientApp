<template>
  <div 
    v-if="mapLayers"
    class="align-self-center mr-3">
    <Form 
      class="d-flex"
      @submit="() => null">
      <FormField 
        class="mr-3"
        v-model="mapModel"
        v-bind="mapModelField"
        :options="mapLayerOptions" />
    </Form>
  </div>
</template>

<script>

import Form from 'molecule/form/Form'
import FormField from 'molecule/form/FormField'
import { mapGetters, mapMutations } from 'vuex'

export default {
  components: {
    Form, FormField
  },
  data() {
    return {
      mapModelField: {
        type: 'select',
        label: null,
        novalidate: true,
      }
    }
  },
  computed: {
    ...mapGetters('map', [
      'mapLayers',
      'activeLayer'
    ]),
    mapLayerOptions() {
      return this.mapLayers.map(layer => {
        return {
          value: layer.id,
          text: layer.name
        }
      })
    },
    mapModel: {
      get() {
        return this.activeLayer ? this.activeLayer.id : null
      },
      set (value) {
        this.setActiveLayer({ id: value })
      }
    }
  },
  watch: {
    mapLayers(value) {
      if (value && !this.activeLayer) {
        this.setActiveLayer({ id: value[0].id })  
      }
    }
  },
  created() {
    // If layers are available, yet none is selected, select the first
    if (this.mapLayers && !this.activeLayer) {
      this.setActiveLayer({ id: this.mapLayers[0].id })
    }
  },
  methods: {
    ...mapMutations('map', [
      'setActiveLayer'
    ])
  }
}
</script>
