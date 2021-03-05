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
  computed: {
    ...mapGetters('reviewers', [
      'getUserById',
      'areReviewersAvailable'
    ]),
    userObject() {
      if (this.user.getUserName()) {
        return this.user
      }
      if (this.user.getRole() === 'Reviewer' && this.areReviewersAvailable) {
        return this.getUserById({ id: this.user.id })
      }

      return null
    }
  }
}
</script>

<style lang="scss">
.ReportUserRole {
  &__name {
    color: $oxford-blue;
    font-size: 16px;
    line-height: 1
  }
  &__role {
    color: $regent-gray;
    line-height: 1
  }
}
</style>
