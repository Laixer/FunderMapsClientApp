<template>
  <div v-if="isSuperUser() && orgUsersExcludingSelf">
    <div class="panel px-4 py-3" style="width: 300px">
      <h2 class="font-weight-bold mt-1 mb-4">Teamleden</h2>
      <TeamMember 
        v-for="(member, index) in orgUsersExcludingSelf" 
        :member="member"
        :key="index"
        @edit="handleEdit" />
    </div>

    <TeamMemberModal :id="editUserId" />

  </div>
</template>

<script>
import { isSuperUser } from 'service/auth'
import { mapGetters, mapActions } from 'vuex'

import TeamMember from 'molecule/TeamMember'
import TeamMemberModal from 'organism/TeamMemberModal'

import { getUserId } from 'service/auth'

export default {
  components: {
    TeamMember, TeamMemberModal
  },
  data() {
    return {
      editUserId: ''
    }
  },
  computed: {
    ...mapGetters('org', [
      'getOrgId'
    ]),
    ...mapGetters('orgUsers', [
      'orgUsers'
    ]),
    orgUsersExcludingSelf() {
      let id = getUserId()
      return this.orgUsers ? this.orgUsers.filter(
        user => user.user.id !== id
      ) : false
    }
  },
  async created() {
    if (this.isSuperUser()) {
      await this.getUsers({ orgId: this.getOrgId })
    }
  },
  methods: {
    isSuperUser,
    ...mapActions('orgUsers', [
      'getUsers'
    ]),
    handleEdit({ id }) {
      this.editUserId = id;
      this.$bvModal.show('modal-teammember')
    }
  }
}
</script>

<style scoped lang="scss">
h1 {
  font-size: 30px;
  color: #354052;
}

.panel {
  background: white;
  border-radius: 4px;
  border: 1px solid #E6EAEE;

  h2 {
    font-size: 22px;
    color: #354052;
  }
}
</style> 
