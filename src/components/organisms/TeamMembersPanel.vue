<template>
  <div>
    <div v-if="(isSuperUser() || isAdmin()) && orgUsers">
      <b-button
        variant="primary"
        class="side__btn font-weight-bold align-items-center"
        @click="handleCreate"
        style="width: 300px"
      >
        <span class="d-inline-block my-2"> Gebruiker registreren </span>
      </b-button>

      <div class="panel px-4 py-3 my-4" style="width: 300px">
        <h2 class="font-weight-bold mt-1 mb-4">Teamleden</h2>
        <TeamMember
          v-for="(member, index) in orgUsers"
          :member="member"
          :key="index"
          @edit="handleEdit"
          @remove="handleRemove"
        />
      </div>

      <TeamMemberModal :userId="editUserId" :organizationId="organizationId" />

      <RemoveTeamMemberModal
        :userId="editUserId"
        :organizationId="organizationId"
      />
    </div>

    <NewTeamMemberModal :organizationId="organizationId" />
  </div>
</template>

<script>
import { isSuperUser, isAdmin } from "service/auth";
import { mapGetters, mapActions } from "vuex";

import TeamMember from "molecule/TeamMember";
import TeamMemberModal from "organism/TeamMemberModal";
import NewTeamMemberModal from "organism/NewTeamMemberModal";
import RemoveTeamMemberModal from "organism/RemoveTeamMemberModal";

import { getUserId } from "service/auth";

export default {
  components: {
    TeamMember,
    TeamMemberModal,
    NewTeamMemberModal,
    RemoveTeamMemberModal,
  },
  data() {
    return {
      editUserId: null,
    };
  },
  computed: {
    ...mapGetters("org", ["getOrgId"]),
    ...mapGetters("orgUsers", ["orgUsers"]),
    organizationId() {
      if (isAdmin() && this.$route.params.id) {
        return this.$route.params.id;
      } else if (this.isSuperUser()) {
        return this.getOrgId;
      }
      return false;
    },
  },
  async created() {
    if (isAdmin() || isSuperUser()) {
      this.clearUsers();

      // Act according to user privileges
      if (isAdmin()) {
        await this.adminGetUsers({ organizationId: this.organizationId });
      } else if (isSuperUser()) {
        await this.getUsers();
      }
    }
  },
  methods: {
    isAdmin,
    isSuperUser,
    ...mapActions("orgUsers", ["getUsers", "adminGetUsers", "clearUsers"]),
    handleEdit({ id }) {
      this.editUserId = id;
      this.$bvModal.show("modal-teammember");
    },
    handleRemove({ id }) {
      if (id !== getUserId()) {
        this.editUserId = id;
        this.$bvModal.show("modal-remove-teammember");
      }
    },
    handleCreate() {
      this.$bvModal.show("modal-new-teammember");
    },
  },
};
</script>

<style scoped lang="scss">
h1 {
  font-size: 30px;
  color: #354052;
}

.panel {
  background: white;
  border-radius: 4px;
  border: 1px solid #e6eaee;

  h2 {
    font-size: 22px;
    color: #354052;
  }
}
</style> 
