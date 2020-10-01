<template>
  <div v-if="areReviewersAvailable" class="ReportForm">
    <ProgressSteps :steps="steps" />
    <Form ref="form" @submit="handleSubmit" class="ReportForm__form mt-5">
      <ReportStepHeader :step="1" :label="headerLabel" />

      <div class="ReportForm__pane p-5">
        <Feedback :feedback="feedback" />

        <FormField v-model="fields.documentName.value" v-bind="fields.documentName" />
        <div class="form-row">
          <FormField v-model="fields.type.value" v-bind="fields.type" class="col-md-6" />
          <FormField v-model="fields.date.value" v-bind="fields.date" class="col-md-6" />
        </div>
        <div class="form-row">
          <FormField v-model="fields.contractor.value" v-bind="fields.contractor" class="col-md-6" />
          <FormField v-model="fields.reviewer.value" v-bind="fields.reviewer" class="col-md-6" />
        </div>
        <Divider />
        <div class="form-row">
          <FormField v-model="fields.standardF3o.value" v-bind="fields.standardF3o" class="col-md-3" />
          <FormField v-model="fields.inspection.value" v-bind="fields.inspection" class="col-md-3" />
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
    <div class="d-flex justify-content-center mt-4">
      <PrimaryArrowButton :disabled="isDisabled" :to="nextStep" label="Volgende" />
    </div>
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
    PrimaryArrowButton,
    ReportStepHeader
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
            maxLength: maxLength(64)
          },
          disabled: false
        },
        type: {
          label: "Type document",
          value: "4",
          type: "select",
          options: [
            {
              value: null,
              text: "Selecteer een type"
            }
          ].concat(
            typeOptions.map((option, index) => {
              return {
                value: "" + index,
                text: option.text
              };
            })
          ),
          validationRules: {
            required
          },
          disabled: false
        },
        date: {
          label: "Datum document",
          value: "",
          type: "datepicker",
          validationRules: {
            required
            // TODO: Set min/max
          },
          disabled: false
        },
        contractor: {
          label: "Uitvoerder",
          value: null,
          type: "select",
          validationRules: {
            required
          },
          disabled: false
        },
        reviewer: {
          label: "Reviewer",
          value: null,
          type: "select",
          options: [],
          validationRules: {
            required
          },
          disabled: false
        },
        standardF3o: {
          label: "Conform F3O",
          value: false,
          type: "radio",
          options: [
            {
              value: true,
              text: "ja"
            },
            {
              value: false,
              text: "nee"
            }
          ],
          validationRules: {
            required
          },
          disabled: false
        },
        inspection: {
          label: "Onderzoeksput",
          value: false,
          type: "radio",
          options: [
            {
              value: true,
              text: "ja"
            },
            {
              value: false,
              text: "nee"
            }
          ],
          validationRules: {
            required
          },
          disabled: false
        },
        jointMeasurement: {
          label: "Lintvoegmetingen",
          value: false,
          type: "radio",
          options: [
            {
              value: true,
              text: "ja"
            },
            {
              value: false,
              text: "nee"
            }
          ],
          validationRules: {
            required
          },
          disabled: false
        },
        floorMeasurement: {
          label: "Vloer Waterpas",
          value: false,
          type: "radio",
          options: [
            {
              value: true,
              text: "ja"
            },
            {
              value: false,
              text: "nee"
            }
          ],
          validationRules: {
            required
          },
          disabled: false
        },
        note: {
          label: "Opmerking",
          value: "",
          type: "textarea",
          validationRules: {},
          disabled: false
        }
      },
      steps: [
        new ProgressStep({
          status: "active",
          step: 1,
          icon: "Step-create-icon.svg"
        }),
        new ProgressStep({
          step: 2,
          icon: "Step-samples-icon.svg"
        }),
        new ProgressStep({
          step: 3,
          icon: "Step-verify-icon.svg"
        })
      ]
    };
  },
  computed: {
    ...mapGetters("reviewers", ["reviewers", "areReviewersAvailable"]),
    ...mapGetters("report", ["activeReport"]),
    ...mapGetters("org", ["organization"]),
    ...mapGetters("contractors", ["contractors"]),
    nextStep() {
      // TODO When will this.activeReport go to null ever?
      let report = this.activeReport || { id: "id", documentName: "documentName" };
      return {
        name: "edit-report-2",
        params: { 
          id: report.id, 
          documentName: report.documentName 
        }
      };
    },
    headerLabel() {
      return this.activeReport ? this.activeReport.documentName : null;
    },
    getReviewerOptions() {
      if (this.reviewers) {
        return [
          {
            value: null,
            text: "Selecteer een reviewer"
          }
        ].concat(this.reviewers.map(this.mapToUserOption));
      }
      return [
        {
          value: null,
          text: "Er zijn geen reviewers beschikbaar"
        }
      ];
    },
    getContractorOptions() {
      if (this.contractors) {
        return [
          {
            value: null,
            text: "Selecteer een uitvoerder"
          }
        ].concat(this.contractors.map(this.mapToOrgOption));
      }
      return [
        {
          value: null,
          text: "Er zijn geen uitvoerders beschikbaar"
        }
      ];
    }
  },
  async created() {

    console.log('this.activeReport', this.activeReport)

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
   * If we're leaving and heading towards step 2, save the document!
   */
  async beforeRouteLeave(to, from, next) {
    if (to.name !== "edit-report-2" || this.stored === true) {
      next();
    } else {
      // trigger submit
      await this.$refs.form.submit();
      next(false);
    }
  },
  methods: {
    ...mapActions("report", [
      "getReportById",
      "updateReport",
      "createReport",
      "clearActiveReport"
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

      // Make the documentName accessible as data
      if (this.$route.params.file) {

        // TODO Remove
        console.log('this.$route.params', this.$route.params)

        this.fields.documentName.value = this.$route.params.file.name;
        this.documentFile = this.$route.params.documentFile;
      }

      // Set the contractor & reviewer user options (from Vuex)
      this.fields.reviewer.options = this.getReviewerOptions;
      this.fields.contractor.options = this.getContractorOptions;
      this.fields.reviewer.permaDisabled = false;
      this.fields.contractor.permaDisabled = false;

      // If there is only one reviewer option, select it.
      if (this.fields.reviewer.options.length === 2) {
        this.fields.reviewer.value = this.fields.reviewer.options[1].value;
      }
    },

    /**
     * Prepare the fields with data from the active report.
     */
    async prepareExistingReport() {
      if (!canWrite()) {
        await this.$router.push({
          name: "view-report",
          params: this.$route.params
        });
        return;
      }

      // Set the contractor & reviewer user options (from Vuex)
      this.fields.reviewer.options = this.getReviewerOptions;
      this.fields.contractor.options = this.getContractorOptions;

      await this.getReportById({
        id: this.$route.params.id
      });

      let report = this.activeReport;

      if ((report.isPendingReview() || report.isApproved()) && !isSuperUser()) {
        await this.$router.push({
          name: "view-report",
          params: this.$route.params
        });
        return;
      }

      // The internally stored document file is required but is not
      // present in the field values. We store it explicitly.
      this.documentFile = report.documentFile;

      this.setFieldValues({
        type: report.type,
        documentName: report.documentName,
        date: report.documentDate,
        contractor: report.contractorId ? report.contractorId : null,
        reviewer: report.reviewerId ? report.reviewerId : null,
        standardF3o: report.standardF3o,
        inspection: report.inspection,
        jointMeasurement: report.jointMeasurement,
        floorMeasurement: report.floorMeasurement,
        note: report.note
      });
    },

    /**
     * User / Org mapping
     */
    mapToUserOption(user) {
      return {
        value: user.id,
        text: user.getUserName()
      };
    },
    mapToOrgOption(org) {
      return {
        value: org.id,
        text: org.name
      };
    },
    saveReport() {
      this.$refs.form.submit();
    },

    /**
     * Handle the creation of the report
     */
    async handleSubmit() {

      // TODO Remove
      console.log('handleSubmit()')

      this.disableAllFields();
      this.isDisabled = true;
      this.feedback = {
        variant: "info",
        message: "Bezig met opslaan van rapport..."
      };

      let values = this.allFieldValues();

      let data = {
        documentName: values.documentName,
        inspection: values.inspection,
        jointMeasurement: values.jointMeasurement,
        floorMeasurement: values.floorMeasurement,
        note: values.note,
        documentDate: values.date.toISOString(),
        documentFile: this.documentFile,
        type: parseInt(values.type),
        standardF3o: values.standardF3o,
        auditStatus: values.status,
        reviewer: values.reviewer,
        contractor: values.contractor,
        // TODO Access policy?
      };

      if (this.activeReport) {
        data["id"] = this.$route.params.id;

        await this.updateReport({
          id: this.$route.params.id,
          document: this.$route.params.document,
          data
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

      // next();
      this.$router.push({
        name: "edit-report-2",
        params: {
          id: this.activeReport.id,
          document: this.activeReport.documentFile
        }
      });
    },
    errorHandler(err) {
      this.enableAllFields();
      this.isDisabled = false;

      if (err.response && err.response.status === 401) {
        this.feedback = {
          variant: "danger",
          message: "Uw sessie is verlopen"
        };
      } else {
        this.feedback = {
          variant: "danger",
          message: "Onbekende fout. Probeer het later nog eens."
        };
      }
    }
  }
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
