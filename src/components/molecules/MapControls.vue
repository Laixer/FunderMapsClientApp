<template>
  <li v-if="mapBundles.length" class="Bundles align-self-center mr-3">
    <Form class="d-flex" @submit="() => null">
      <FormField
        class="mr-3"
        v-model="mapModel"
        v-bind="mapModelField"
        :options="mapBundleOptions"
      />
    </Form>
  </li>
</template>

<script>
import { icon } from "helper/assets";
import Form from "molecule/form/Form";
import FormField from "molecule/form/FormField";
import { mapGetters, mapMutations } from "vuex";

export default {
  components: {
    Form,
    FormField,
  },
  data() {
    return {
      mapModelField: {
        type: "select",
        label: null,
        novalidate: true,
      },
    };
  },
  computed: {
    ...mapGetters("map", ["mapBundles", "activeBundle"]),
    mapBundleOptions() {
      return [...this.mapBundles].map((bundle) => {
        return {
          value: bundle.id,
          text: bundle.name,
        };
      });
    },
    mapModel: {
      get() {
        return this.activeBundle.id;
      },
      set(value) {
        this.setActiveBundle({ id: value });
      },
    },
  },
  methods: {
    icon,
    ...mapMutations("map", ["setActiveBundle"]),
  },
};
</script>

<style lang="scss">
.Bundles {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  .side__btn {
    margin: 5px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    span {
      margin-left: 5px;
      line-height: 12px;
    }
  }
}
</style>
