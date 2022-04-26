<template>
  <div v-if="areReviewersAvailable">
    <ProgressSteps :steps="steps" />
    <div class="container spacing-bottom">
      <div class="row">
        <div class="col-lg-10 offset-lg-1">
          <Form ref="form" @submit="handleSubmit" class="ReportForm__form mt-5">
            <!-- <ReportStepHeader :step="1" :label="headerLabel" /> -->

            <div class="ReportForm__pane p-5">
              <Feedback :feedback="feedback" />

              <FormField
                v-model="fields.documentName.value"
                v-bind="fields.documentName"
                placeholder="Naam van het document"
              />
              <div class="form-row">
                <FormField
                  v-model="fields.type.value"
                  v-bind="fields.type"
                  class="col-md-6"
                />
                <FormField
                  v-model="fields.documentDate.value"
                  v-bind="fields.documentDate"
                  class="col-md-6"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-model="fields.contractorId.value"
                  v-bind="fields.contractorId"
                  class="col-md-6"
                />
                <FormField
                  v-model="fields.reviewerId.value"
                  v-bind="fields.reviewerId"
                  class="col-md-6"
                />
              </div>
              <Divider />
              <div class="form-row">
                <FormField
                  v-model="fields.standardF3o.value"
                  v-bind="fields.standardF3o"
                  class="col-md-3"
                />
                <FormField
                  v-model="fields.inspection.value"
                  v-bind="fields.inspection"
                  class="col-md-3"
                />
                <FormField
                  v-model="fields.jointMeasurement.value"
                  v-bind="fields.jointMeasurement"
                  class="col-md-3"
                />
                <FormField
                  v-model="fields.floorMeasurement.value"
                  v-bind="fields.floorMeasurement"
                  class="col-md-3"
                />
              </div>
              <FormField v-model="fields.note.value" v-bind="fields.note" />
            </div>
          </Form>
          <!-- <div class="d-flex justify-content-center mt-4">
            <PrimaryArrowButton
              :disabled="isDisabled"
              :to="nextStep"
              label="Volgende"
            />
          </div> -->
        </div>
      </div>
    </div>

    <NavigationBar :prev="null" :next="nextStep" />
  </div>
  <div v-else>
    <!-- TODO: Show an error page -->
    Geen reviewer beschikbaar.
  </div>
</template>

<script>
import Form from "molecule/form/Form";
import FormField from "molecule/form/FormField";
import ProgressSteps from "molecule/ProgressSteps";
import ProgressStep from "model/ProgressStep";
import Divider from "atom/Divider";
import Feedback from "atom/Feedback";
import ReportStepHeader from "atom/ReportStepHeader";
import PrimaryArrowButton from "atom/navigation/PrimaryArrowButton";
import NavigationBar from "molecule/NavigationBar";

import { required, maxLength } from "vuelidate/lib/validators";
import { typeOptions } from "config/enums";
import { canWrite, isSuperUser } from "service/auth";
import { mapGetters, mapActions } from "vuex";
import fields from "mixin/fields";
import { EventBus } from "utils/eventBus.js";

export default {
  components: {
    Form,
    FormField,
    Feedback,
    ProgressSteps,
    Divider,
    NavigationBar,
    // PrimaryArrowButton,
    // ReportStepHeader,
  },
  mixins: [fields],
  data() {
    return {
      isDisabled: false,
      feedback: {},
      documentName: null,
      stored: false, // navigation blocker
      fields: {
        documentName: {
          label: "Document naam",
          value: "",
          validationRules: {
            required,
            maxLength: maxLength(64),
          },
          disabled: false,
        },
        type: {
          label: "Type document",
          value: "4",
          type: "select",
          options: [
            {
              value: null,
              text: "Selecteer een type",
            },
          ].concat(
            typeOptions.map((option, index) => {
              return {
                value: "" + index,
                text: option.text,
              };
            })
          ),
          validationRules: {
            required,
          },
          disabled: false,
        },
        documentDate: {
          label: "Datum document",
          value: "",
          type: "datepicker",
          validationRules: {
            required,
            min: (value) => value > new Date(1000, 1, 1),
            max: (value) => value < new Date(2100, 1, 1),
          },
          disabled: false,
        },
        contractorId: {
          label: "Uitvoerder",
          value: null,
          type: "select",
          validationRules: {
            required,
          },
          disabled: false,
        },
        reviewerId: {
          label: "Reviewer",
          value: null,
          type: "select",
          options: [],
          validationRules: {
            required,
          },
          disabled: false,
        },
        standardF3o: {
          label: "Conform F3O",
          value: false,
          type: "radio",
          options: [
            {
              value: true,
              text: "ja",
            },
            {
              value: false,
              text: "nee",
            },
          ],
          validationRules: {
            required,
          },
          disabled: false,
        },
        inspection: {
          label: "Onderzoeksput",
          value: false,
          type: "radio",
          options: [
            {
              value: true,
              text: "ja",
            },
            {
              value: false,
              text: "nee",
            },
          ],
          validationRules: {
            required,
          },
          disabled: false,
        },
        jointMeasurement: {
          label: "Lintvoegmetingen",
          value: false,
          type: "radio",
          options: [
            {
              value: true,
              text: "ja",
            },
            {
              value: false,
              text: "nee",
            },
          ],
          validationRules: {
            required,
          },
          disabled: false,
        },
        floorMeasurement: {
          label: "Vloer Waterpas",
          value: false,
          type: "radio",
          options: [
            {
              value: true,
              text: "ja",
            },
            {
              value: false,
              text: "nee",
            },
          ],
          validationRules: {
            required,
          },
          disabled: false,
        },
        note: {
          label: "Opmerking",
          value: "",
          type: "textarea",
          validationRules: {},
          disabled: false,
        },
      },
      steps: [
        new ProgressStep({
          status: "active",
          step: 1,
          icon: "Step-create-icon.svg",
          title: "Rapportinformatie",
          to: "edit-report-1",
        }),
        new ProgressStep({
          step: 2,
          icon: "Step-samples-icon.svg",
          title: "Funderingsgegevens",
          to: "edit-report-2",
        }),
        new ProgressStep({
          step: 3,
          icon: "Step-verify-icon.svg",
          title: "Controle overzicht",
          to: "edit-report-3",
        }),
      ],
    };
  },
  computed: {
    ...mapGetters("reviewers", ["validReviewers", "areReviewersAvailable"]),
    ...mapGetters("report", ["activeReport"]),
    ...mapGetters("contractors", ["contractors"]),
    nextStep() {
      // TODO When will this.activeReport go to null ever?
      let report = this.activeReport || {
        id: "id",
        documentName: "documentName",
      };
      return {
        name: "edit-report-2",
        params: {
          id: report.id,
          documentName: report.documentName,
          step: 1,
        },
      };
    },
    headerLabel() {
      return this.activeReport ? this.activeReport.documentName : null;
    },
    getReviewerOptions() {
      if (this.validReviewers) {
        return [
          {
            value: null,
            text: "Selecteer een reviewer",
          },
        ].concat(this.validReviewers.map(this.mapToUserOption));
      }
      return [
        {
          value: null,
          text: "Er zijn geen reviewers beschikbaar",
        },
      ];
    },
    getContractorOptions() {
      if (this.contractors) {
        return [
          {
            value: null,
            text: "Selecteer een uitvoerder",
          },
        ].concat(this.contractors.map(this.mapToOrgOption));
      }
      return [
        {
          value: null,
          text: "Er zijn geen uitvoerders beschikbaar",
        },
      ];
    },
  },
  async created() {
    await this.getReviewers();
    await this.getContractors();
    if (this.$route.name === "new-report") {
      this.prepareEmptyForm();
    } else {
      this.prepareExistingReport();
    }
    EventBus.$on("save-report", this.saveReport);
  },
  beforeDestroy() {
    EventBus.$off("save-report", this.saveReport);
  },
  /**
   * If we're leaving and heading towards step 2, save the document.
   * If nothing was modified in the form, just go to the next step.
   */
  async beforeRouteLeave(to, from, next) {
    let values = this.allFieldValues();

    if (to.name !== "edit-report-2" || this.stored === true) {
      next();
      // TODO Clean up this monstrosity.
    } else if (
      to.name === "edit-report-2" &&
      this.activeReport &&
      values.documentName === this.activeReport.documentName &&
      values.type === this.activeReport.type &&
      values.documentDate === this.activeReport.documentDate &&
      values.contractorId === this.activeReport.contractorId &&
      values.reviewerId === this.activeReport.reviewerId &&
      values.standardF3o === this.activeReport.standardF3o &&
      values.inspection === this.activeReport.inspection &&
      values.jointMeasurement === this.activeReport.jointMeasurement &&
      values.floorMeasurement === this.activeReport.floorMeasurement &&
      values.note === this.activeReport.note
    ) {
      // Skip form submit.
      next();
    } else {
      // Trigger form submit.
      await this.$refs.form.submit();
      next(false);
    }
  },
  methods: {
    ...mapActions("report", [
      "getReportById",
      "updateReport",
      "createReport",
      "clearActiveReport",
    ]),
    ...mapActions("reviewers", ["getReviewers"]),
    ...mapActions("contractors", ["getContractors"]),
    /**
     * Prepare an empty form, for creating a new document
     */
    prepareEmptyForm() {
      if (!canWrite()) {
        this.$router.push({ name: "dashboard" });
        return;
      }

      this.clearActiveReport();

      if (this.$route.params.file) {
        // Exlicitly extract the uploaded document file name from
        // the route params.
        this.fields.documentName.value = this.$route.params.file.name;

        // The internally stored document file is required but is not
        // present in the field values. We store it explicitly.
        this.documentFile = this.$route.params.documentFile;
      }

      // Set the contractor & reviewer user options (from Vuex)
      this.fields.reviewerId.options = this.getReviewerOptions;
      this.fields.contractorId.options = this.getContractorOptions;
      this.fields.reviewerId.permaDisabled = false;
      this.fields.contractorId.permaDisabled = false;

      // If there is only one reviewer option, select it.
      if (this.fields.reviewerId.options.length === 2) {
        this.fields.reviewerId.value = this.fields.reviewerId.options[1].value;
      }
    },

    /**
     * Prepare the fields with data from the active report.
     */
    async prepareExistingReport() {
      if (!canWrite()) {
        await this.$router.push({
          name: "view-report",
          params: this.$route.params,
        });
        return;
      }

      // Set the contractor & reviewer user options (from Vuex)
      this.fields.reviewerId.options = this.getReviewerOptions;
      this.fields.contractorId.options = this.getContractorOptions;

      await this.getReportById({
        id: this.$route.params.id,
      });

      let report = this.activeReport;

      if ((report.isPendingReview() || report.isApproved()) && !isSuperUser()) {
        await this.$router.push({
          name: "view-report",
          params: this.$route.params,
        });
        return;
      }

      // The internally stored document file is required but is not
      // present in the field values. We store it explicitly.
      this.documentFile = report.documentFile;

      this.setFieldValues({
        type: report.type,
        documentName: report.documentName,
        documentDate: report.documentDate,
        contractorId: report.contractorId ? report.contractorId : null,
        reviewerId: report.reviewerId ? report.reviewerId : null,
        standardF3o: report.standardF3o,
        inspection: report.inspection,
        jointMeasurement: report.jointMeasurement,
        floorMeasurement: report.floorMeasurement,
        note: report.note,
      });
    },

    /**
     * User / Org mapping
     */
    mapToUserOption(user) {
      return {
        value: user.id,
        text: user.getUserName(),
      };
    },
    mapToOrgOption(org) {
      return {
        value: org.id,
        text: org.name,
      };
    },
    saveReport() {
      this.$refs.form.submit();
    },

    /**
     * Handle the creation or updating of the report. This does not
     * check for any modifications in the form, this will always
     * submit the form to the API. This check is done in the
     * beforeRouteLeave() method.
     */
    async handleSubmit() {
      this.disableAllFields();
      this.isDisabled = true;
      this.feedback = {
        variant: "info",
        message: "Bezig met opslaan van rapport...",
      };

      let values = this.allFieldValues();
      let data = {
        documentName: values.documentName,
        inspection: values.inspection,
        jointMeasurement: values.jointMeasurement,
        floorMeasurement: values.floorMeasurement,
        note: values.note,
        documentDate: new Date(
          Date.UTC(
            values.documentDate.getFullYear(),
            values.documentDate.getMonth(),
            values.documentDate.getDate()
          )
        ).toISOString(),
        documentFile: this.documentFile,
        type: parseInt(values.type),
        standardF3o: values.standardF3o,
        auditStatus: values.status,
        reviewer: values.reviewerId,
        contractor: values.contractorId,
        // TODO Access policy?
      };

      if (this.activeReport) {
        data["id"] = this.$route.params.id;

        await this.updateReport({
          id: this.$route.params.id,
          data,
        })
          .then(this.handleSuccess)
          .catch(this.errorHandler);
      } else {
        await this.createReport(data)
          .then(this.handleSuccess)
          .catch(this.errorHandler);
      }
    },
    handleSuccess() {
      this.stored = true;
      this.$router.push({
        name: "edit-report-2",
        params: {
          id: this.activeReport.id,
          document: this.activeReport.documentFile,
        },
      });
    },
    errorHandler(err) {
      this.enableAllFields();
      this.isDisabled = false;

      if (err.response && err.response.status === 401) {
        this.feedback = {
          variant: "danger",
          message: "Uw sessie is verlopen",
        };
      } else {
        this.feedback = {
          variant: "danger",
          message: "Onbekende fout. Probeer het later nog eens.",
        };
      }
    },
  },
};
</script>

<style lang="scss">
.ReportForm {
  width: 780px;
  margin: auto;

  &__pane {
    border-radius: 5px;
    border: 1px solid #ced0da;
    background: white;

    h2 {
      font-size: 24px;
      line-height: 20px;
      color: #3d5372;
      margin-bottom: 31px;
    }
  }
}
</style>
