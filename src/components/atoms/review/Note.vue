<template>
  <div class="Note d-flex">
    <div class="Note__icon">
      <img
        class="mt-3"
        :src="icon('Notification-icon.svg')"
        width="15"
        height="15"
      />
    </div>
    <div class="Note__note">
      {{ note }}
    </div>
  </div>
</template>

<script>
import { icon } from "helper/assets";
export default {
  name: "Note",
  props: {
    note: {
      type: String,
      default:
        "Dit is een voorbeeld van de plaatsing van een opmerking. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.",
    },
  },
  methods: {
    icon,
  },
};
</script>

<style lang="scss">
.Note {
  &__icon {
    width: 30px;
  }
  &__note {
    border-radius: 4px;
    border: 1px solid #ced0da;
    background: white;
    padding: 7px 15px 17px;
    line-height: 24px;
    font-size: 16px;
    width: calc(100% - 30px);
    color: #7f8fa4;
  }
}
</style>
