<template>
  <div class="ViewHeader d-flex align-items-center pr-3">
    <div v-if="isAvailableForReview" class="d-flex align-items-center">
      Status:
      <div
        :class="approvedClasslist"
        class="ViewHeader__choice ml-4 align-items-center"
        @click="handleApprove"
      >
        <img :src="approveIcon" width="30" height="30" />
        <div class="ml-3">{{ approveLabel }}</div>
      </div>
      <span
        :class="disapprovedClasslist"
        class="ViewHeader__choice ml-4 align-items-center"
        @click="handleDisapproveModal"
      >
        <img :src="disapproveIcon" width="30" height="30" />
        <span class="ml-3">{{ disapproveLabel }}</span>
      </span>
    </div>
    <!-- TODO Cleanup this ugly if statement-->
    <div
      v-else-if="
        approved === true ||
        approved === false ||
        approvedByUser === true ||
        approvedByUser === false
      "
      class="d-flex align-items-center"
    >
      Status:
      <div
        v-if="approved === true || approvedByUser === true"
        :class="approvedClasslist"
        class="ViewHeader__choice ml-4 align-items-center"
      >
        <img :src="approveIcon" width="30" height="30" />
        <div class="ml-3">Goedgekeurd</div>
      </div>
      <div
        v-else-if="approved === false || approvedByUser === false"
        :class="disapprovedClasslist"
        class="ViewHeader__choice ml-4 align-items-center"
      >
        <img :src="disapproveIcon" width="30" height="30" />
        <span class="ml-3">Afgekeurd</span>
      </div>
    </div>
    <div class="flex-grow-1"></div>

    <b-button
      v-if="editable"
      :to="editRoute"
      variant="light"
      class="font-weight-bold"
    >
      Bewerk
    </b-button>
    <b-button
      :to="{ name: 'dashboard' }"
      variant="primary"
      class="ml-2 mr-3 font-weight-bold d-flex align-items-center"
    >
      <img :src="icon('Close-icon.svg')" width="11" height="11" />
      <span class="ml-1">Sluiten</span>
    </b-button>

    <DisapproveModal @disapprove="handleDisapprove" />
  </div>
</template>

<script>
import { icon } from "helper/assets";
import { mapGetters, mapActions } from "vuex";
import DisapproveModal from "organism/DisapproveModal";

import { canWrite, isVerifier, canApprove } from "service/auth";

export default {
  name: "ViewHeader",
  components: {
    DisapproveModal,
  },
  data() {
    return {
      /**
       * This can be true, false or null.
       * True indicates we have been approved by the user.
       * False indicates we have been rejected by the user.
       * Null indicates anything else.
       */
      approvedByUser: null,
    };
  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
    ...mapGetters("user", ["user"]),
    editRoute() {
      let report = this.activeReport
        ? this.activeReport
        : { id: "id", documentId: "document" };
      return {
        name: "edit-report-1",
        params: {
          id: report.id,
          documentName: report.documentName,
        },
      };
    },
    editable() {
      if (!canWrite() || isVerifier()) {
        return false;
      }

      if (this.activeReport) {
        return this.activeReport.isEditable();
      }

      // TODO This part was removed. Our API does not support this.
      //|| isSuperUser()
      return false;
    },
    approved() {
      if (this.activeReport) {
        return this.activeReport.getApprovalState();
      }

      return null;
    },
    isAvailableForReview() {
      if (!canApprove()) {
        return false;
      }
      if (this.activeReport) {
        return (
          this.activeReport.isPendingReview() &&
          this.activeReport.reviewerId === this.user.id
        );
      }
      return false;
    },
    isPendingReview() {
      if (this.activeReport) {
        return this.activeReport.isPendingReview();
      }
      return false;
    },

    // TODO These if-statements are very ugly. Bind them in the future.

    disapprovedClasslist() {
      return {
        "ViewHeader__choice--active":
          this.approved === false || this.approvedByUser === false,
        "d-none": this.approved === true || this.approvedByUser === true,
        "d-flex": this.approved !== true || this.approvedByUser !== true,
      };
    },
    approvedClasslist() {
      return {
        "ViewHeader__choice--active":
          this.approved === true || this.approvedByUser === true,
        "d-none": this.approved === false || this.approvedByUser === false,
        "d-flex": this.approved !== false || this.approvedByUser !== false,
      };
    },
    approveIcon() {
      return icon(
        this.approved === true || this.approvedByUser === true
          ? "ActiveApprove-icon.svg"
          : "NeutralApprove-icon.svg"
      );
    },
    disapproveIcon() {
      return icon(
        this.approved === false || this.approvedByUser === false
          ? "ActiveDisapprove-icon.svg"
          : "NeutralDisapprove-icon.svg"
      );
    },
    approveLabel() {
      return this.approved === true ? "Goedgekeurd" : "Goedkeuren";
    },
    disapproveLabel() {
      return this.approved === false ? "Afgekeurd" : "Afkeuren";
    },
  },
  methods: {
    icon,
    ...mapActions("report", ["approveReport"]),
    // TODO: Update with call - Done ?
    async handleApprove() {
      if (!this.isPendingReview) {
        return;
      }
      await this.approveReport({ id: this.activeReport.id });
      this.approvedByUser = true;
    },
    handleDisapproveModal() {
      if (!this.isPendingReview) {
        return;
      }

      this.$bvModal.show("report-disapprove");
    },
    handleDisapprove() {
      this.approvedByUser = false;
    },
  },
};
</script>

<style lang="scss">
.ViewHeader {
  background: white;
  box-shadow: 0 1px 0 0 #ced0da;
  height: 60px;
  width: 100%;
  padding-left: 39px;
  color: #7f8fa4;

  .btn {
    line-height: 19px;

    img {
      position: relative;
      top: -1px;
    }
  }

  &__choice {
    width: 125px;
    cursor: pointer;

    &:hover,
    &--active {
      color: #354052;
      font-weight: 600;
    }
  }
}
</style>
