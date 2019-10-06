<template>
  <div class="align-self-center mr-4">
    <Form 
      class="d-flex"
      @submit="() => null">
      <FormField 
        class="mr-3"
        v-model="mapModel"
        v-bind="mapModelField"
        :options="getMapLayers" />
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
      'getMapLayers',
      'getActiveLayer'
    ]),
    mapLayerOptions() {
      return this.getMapLayers.map(layer => {
        return {
          value: layer.id,
          text: layer.name
        }
      })
    },
    mapModel: {
      get() {
        return this.getActiveLayer.id
      },
      set (value) {
        this.setActiveLayer({ id: value })
      }
    }
  },
  methods: {
    ...mapMutations('map', [
      'setActiveLayer'
    ])
  }
}
</script>
