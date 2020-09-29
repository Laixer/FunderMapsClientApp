<template>
  <div 
    v-if="userObject" 
    class="ReportUserRole d-flex align-items-center mt-4">
    <img :src="userObject.getAvatar()" width="32" height="32" class="rounded-circle" />
    <div class="ml-3">
      <div class="ReportUserRole__name">{{ userObject.getUserName() }}</div>
      <div class="ReportUserRole__role">{{ userRole }}</div>
    </div>
  </div>
</template>

<script>

import { mapGetters } from 'vuex'
import map from '../../../store/map';

export default {
  props: {
    userId: {
      type: String,
      required: true
    },
    userRoleOverride: {
      type: String,
      required: false
    }
  },
  computed: {
    ...mapGetters('reviewers', [
      'reviewers',
      'getUserById',
      'areReviewersAvailable'
    ]),
    userObject() {
      return this.getUserById({id: this.userId});
    },
    userRole() {
      if (this.userRoleOverride) {
        return this.userRoleOverride
      } else {
        return this.userObject.getRole();
      }
    }
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
