<template>
  <tr class="OrganizationProposalTableLine d-flex align-items-center p-2 mb-2">
    <td class="py-1 flex-grow-1">
      <strong>{{ proposal.name }}</strong>
    </td>
    <td>
      {{ proposal.email }}
    </td>
    <td>
      <b-input readonly variant="light" type="url" v-model="tokenLink">
      </b-input>
    </td>
    <td class="d-flex justify-content-end">
      <b-button variant="light" @click="cancelOrganizationProposal">
        Annuleren
      </b-button>
    </td>
  </tr>
</template>

<script>
import { mapActions } from "vuex";

export default {
  name: "OrganizationProposalTableLine",
  props: {
    proposal: {
      type: Object,
      default: function () {
        return {};
      },
    },
  },
  computed: {
    tokenLink() {
      // TODO Is this the way to go?
      let host = window.location.origin || "";

      // TODO: Build wrapper

      return new URL(`register/${this.proposal.id}`, host).toString();
    },
  },
  methods: {
    ...mapActions("org", ["removeProposal"]),
    cancelOrganizationProposal() {
      this.$bvModal
        .msgBoxConfirm(
          "Het verwijderen van de uitnodiging aan " +
            this.proposal.name +
            " kan niet ongedaan worden gemaakt. Het is altijd mogelijk een nieuwe uitnodiging aan te maken, maar de oude uitnodiging zal dan niet langer werken.",
          {
            title: "Bevestig actie - " + this.proposal.name,
            okVariant: "danger",
            okTitle: "Verdwijderen",
            cancelTitle: "Annuleren",
            footerClass: "p-2 mt-3",
            hideHeaderClose: false,
            centered: true,
          }
        )
        .then((confirmation) => {
          if (confirmation) {
            this.removeProposal({ id: this.proposal.id });
          }
        });
    },
  },
};
</script>

<style lang="scss">
.OrganizationProposalTableLine {
  width: 100%;
  background: white;
  border: 1px solid #dfe2e5;
  border-radius: 4px;
  color: #7f8fa4;
  line-height: 1;
  transition: all 0.15s;
  user-select: none;
  cursor: pointer;

  &:hover {
    box-shadow: 0 0 15px 0 rgba(158, 169, 184, 0.7);
    transform: scale(1);
  }

  strong {
    font-weight: 600;
    color: #354052;
  }

  .btn {
    color: #7f8fa4;

    &:hover,
    &:active {
      color: darken(#7f8fa4, 10%);
    }
  }
}
</style>
