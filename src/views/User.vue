<template>
  <div>
    <h1 class="ml-2 mb-3 pb-1">Profiel Instellingen</h1>
    <div class="d-flex">
      <form
        class="mr-4"
        style="width: 570px"
        @submit.prevent="handleUpdateUser"
      >
        <div class="panel px-4 py-3 mb-2">
          <h2 class="font-weight-bold mt-1 mb-4">Algemeen</h2>

          <Feedback :feedback="feedback" />

          <ProfileSetting
            label="Voornaam"
            :editMode="editMode"
            v-model="user.givenName"
          />
          <ProfileSetting
            label="Achternaam"
            :editMode="editMode"
            v-model="user.lastName"
          />
          <ProfileSetting
            label="E-mail"
            :editMode="editMode"
            :disabled="true"
            :value="user.email"
          />
          <ProfileSetting
            label="Functie"
            :editMode="editMode"
            v-model="user.jobTitle"
          />
          <ProfileSetting
            label="Telefoon"
            :editMode="editMode"
            v-model="user.phoneNumber"
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
    </div>
  </div>
</template>

<script>
import ProfileSetting from "molecule/ProfileSetting";
import Feedback from "atom/Feedback";

import { image } from "helper/assets";

import { mapGetters, mapActions } from "vuex";

export default {
  name: "User",

  components: {
    ProfileSetting,
    Feedback,
  },
  data() {
    return {
      editMode: true,
      feedback: {},
    };
  },
  computed: {
    ...mapGetters("user", ["user"]),
  },
  methods: {
    image,
    ...mapActions("user", ["updateUser"]),
    async handleUpdateUser() {
      try {
        this.feedback = {
          variant: "info",
          message: "Bezig met opslaan...",
        };
        await this.updateUser();
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
