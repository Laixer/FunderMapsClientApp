<template>
  <div>
    <h1 class="ml-2 mb-3 pb-1">
      Organisatie Profiel<span v-if="organization"
        >: {{ organization.name }}</span
      >
    </h1>
    <div v-if="organization" class="d-flex">
      <form class="mr-4" style="width: 570px" @submit.prevent="handleUpdateOrg">
        <div class="panel px-4 py-3 mb-2">
          <h2 class="font-weight-bold mt-1 mb-4">Algemeen</h2>

          <Feedback :feedback="feedback" />

          <ProfileSetting
            label="Naam"
            :editMode="editMode"
            :disabled="true"
            v-model="organization.name"
          />
          <ProfileSetting
            label="Email"
            type="email"
            :editMode="editMode"
            v-model="organization.email"
          />
          <ProfileSetting
            label="Telefoonnummer"
            type="tel"
            :editMode="editMode"
            v-model="organization.phoneNumber"
          />
        </div>

        <div class="panel px-4 py-3 mb-2">
          <h2 class="font-weight-bold mt-1 mb-4">Bezoek adres</h2>
          <ProfileSetting
            label="Straat"
            :editMode="editMode"
            v-model="organization.homeStreet"
          />
          <ProfileSetting
            label="Huisnummer"
            :editMode="editMode"
            :maxLength="6"
            type="number"
            v-model="organization.homeAddressNumber"
          />
          <ProfileSetting
            label="Toevoeging"
            :editMode="editMode"
            v-model="organization.homeAddressNumberPostfix"
          />
          <ProfileSetting
            label="Stad"
            :editMode="editMode"
            v-model="organization.homeCity"
          />
          <ProfileSetting
            label="Postcode"
            :editMode="editMode"
            v-model="organization.homeZipcode"
          />
        </div>

        <b-button
          type="submit"
          variant="primary"
          class="SubmitButton font-weight-bold mt-4"
          size="lg"
          pill
        >
          <span class="d-inline-block my-2"> Bewaar instellingen </span>
        </b-button>
      </form>

      <TeamMembersPanel />
    </div>
  </div>
</template>

<script>
import ProfileSetting from "molecule/ProfileSetting";
import TeamMembersPanel from "organism/TeamMembersPanel";
import Feedback from "atom/Feedback";

import { image } from "helper/assets";
import { isAdmin } from "service/auth";

import { mapActions } from "vuex";

export default {
  name: "OrganisatieProfiel",

  components: {
    ProfileSetting,
    TeamMembersPanel,
    Feedback,
  },
  data() {
    return {
      editMode: true,
      feedback: {},
      organization: null,
    };
  },
  async created() {
    this.organization = isAdmin()
      ? await this.getOrganizationById({ id: this.$route.params.id })
      : await this.getOrganization();
  },
  methods: {
    image,
    ...mapActions("org", [
      "updateOrganization",
      "updateOrganizationAsAdmin",
      "getOrganizationById",
      "getOrganization",
    ]),
    async handleUpdateOrg() {
      try {
        this.feedback = {
          variant: "info",
          message: "Bezig met opslaan...",
        };

        // Act according to user privileges.
        if (isAdmin()) {
          await this.updateOrganizationAsAdmin({
            organizationId: this.organization.id,
            data: this.organization,
          });
        } else {
          await this.updateOrganization({
            data: this.organization,
          });
        }

        this.feedback = {
          variant: "success",
          message: "Wijzigingen zijn opgeslagen",
        };
      } catch (err) {
        this.feedback = {
          variant: "danger",
          message: "Wijzigingen zijn niet opgeslagen",
        };
      }
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
<style lang="scss">
// TODO: Rename?
.SubmitButton {
  font-size: 18px;
  line-height: 1;
}
</style>
