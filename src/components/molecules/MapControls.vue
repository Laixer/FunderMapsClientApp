<template>
  <div v-if="mapBundles.size > 1" class="align-self-center mr-3">
    <Form class="d-flex" @submit="() => null">
      <FormField
        class="mr-3"
        v-model="mapModel"
        v-bind="mapModelField"
        :options="mapBundleOptions"
      />
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
      'mapBundles',
      'activeBundle'
    ]),
    mapBundleOptions() {
      return [...this.mapBundles].map(bundle => {
        return {
          value: bundle.id,
          text: bundle.name
        }
      })
    },
    mapModel: {
      get() {
        return this.activeBundle ? this.activeBundle.id : null
      },
      set(value) {
        this.setActiveBundle({ id: value })
      }
    }
  },
  watch: {
    mapBundles(value) {
      if (value.length && !this.activeBundle) {
        this.setActiveBundle({ id: value.values().next().value.id })
      }
    }
  },
  created() {
    // If layers are available, yet none is selected, select the first
    if (this.mapBundles.size && !this.activeBundle) {
      this.setActiveLayer({ id: this.mapBundles.values().next().value.id })
    }
  },
  methods: {
    ...mapMutations('map', [
      'setActiveBundle'
    ])
  }
}
</script>
