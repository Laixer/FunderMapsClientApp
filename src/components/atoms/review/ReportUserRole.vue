<template>
  <div
    v-if="userObject"
    class="ReportUserRole d-flex align-items-center mt-4">
    <img :src="userObject.getAvatar()" width="32" height="32" class="rounded-circle" />
    <div class="ml-3">
      <div class="ReportUserRole__name">{{ userObject.getUserName() }}</div>
      <div class="ReportUserRole__role">{{ userObject.getRole() }}</div>
    </div>
  </div>
</template>

<script>

import { mapGetters } from 'vuex'

export default {
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    userObject = this.getUserById({ id: this.user.id })
  },
  computed: {
    ...mapGetters('orgUsers', [
      'getUserById'
    ])
  }
}
</script>

<style lang="scss">
.ReportUserRole {
  &__name {
    color: #354052;
    font-size: 16px;
    line-height: 1
  }
  &__role {
    color: #7F8FA4;
    line-height: 1
  }
}
</style>
