<template>
  <div class="ReportForm">
    <ProgressSteps :steps="steps" />
    <Form 
      ref="form"
      @submit="handleSubmit"
      class="ReportForm__form mt-5">

      <ReportStepHeader 
        :step="1" 
        :label="headerLabel" />

      <div class="ReportForm__pane p-5">
        
        <Feedback :feedback="feedback" />

        <FormField 
          v-model="fields.document_id.value"
          v-bind="fields.document_id" />
        <div class="form-row">
          <FormField 
            v-model="fields.type.value"
            v-bind="fields.type"
            class="col-md-6" />
          <FormField 
            v-model="fields.date.value"
            v-bind="fields.date"
            class="col-md-6" />
        </div>
        <div class="form-row">
          <FormField 
            v-model="fields.creator.value"
            v-bind="fields.creator"
            class="col-md-6" />
          <FormField 
            v-model="fields.reviewer.value"
            v-bind="fields.reviewer"
            class="col-md-6" />
        </div>
        <Divider />
        <div class="form-row">
          <FormField 
            v-model="fields.conform_f3o.value"
            v-bind="fields.conform_f3o"
            class="col-md-3" />
          <FormField 
            v-model="fields.inspection.value"
            v-bind="fields.inspection"
            class="col-md-3" />
          <FormField 
            v-model="fields.joint_measurement.value"
            v-bind="fields.joint_measurement"
            class="col-md-3" />
          <FormField 
            v-model="fields.floor_measurement.value"
            v-bind="fields.floor_measurement"
            class="col-md-3" />
        </div>
        <FormField 
            v-model="fields.note.value"
            v-bind="fields.note" />
      </div>
    </Form>
    <div class="d-flex justify-content-center mt-4">
      <PrimaryArrowButton 
        :disabled="isDisabled"
        :to="nextStep"
        label="Volgende" />
    </div>

  </div>
</template>

<script>
import Form from 'molecule/form/Form'
import FormField from 'molecule/form/FormField'
import ProgressSteps from 'molecule/ProgressSteps'
import ProgressStep from 'model/ProgressStep'
import Divider from 'atom/Divider'
import Feedback from 'atom/Feedback'
import ReportStepHeader from 'atom/ReportStepHeader'
import PrimaryArrowButton from 'atom/navigation/PrimaryArrowButton'

import { required } from 'vuelidate/lib/validators';
import { typeOptions } from 'config/enums'
import { getUserId } from 'service/auth'
import { mapGetters, mapActions } from 'vuex'
import fields from 'mixin/fields'

export default {
  components: {
    Form, FormField, Feedback, ProgressSteps, 
    Divider, PrimaryArrowButton, ReportStepHeader
  },
  mixins: [ fields ],
  data() {
    return {
      isDisabled: false,
      feedback: {},
      document_name: null,
      stored: false, // navigation blocker
      fields: {
        document_id: {
          label: 'Document naam',
          value: 'test-name',
          validationRules: {
            required
          },
          disabled: false
        },
        type: {
          label: 'Type',
          value: '4',
          type: 'select',
          options: [{
            value: null,
            text: 'Selecteer een type'
          }].concat( 
            typeOptions.map((option, index) => {
              return {
                value: ''+index,
                text: option.text
              }
            })
          ),
          validationRules: {
            required
          },
          disabled: false
        },
        date: {
          label: 'Datum onderzoek',
          value: '',
          type: 'datepicker',
          validationRules: {
            required
          },
          disabled: false
        },
        creator: {
          label: 'Uitvoerder',
          value: null,
          type: 'select',
          validationRules: {
            required
          },
          disabled: false
        },
        reviewer: {
          label: 'Reviewer',
          value: null,
          type: 'select',
          options: [],
          validationRules: {
            required
          },
          disabled: false
        },
        conform_f3o: {
          label: 'Conform F3O',
          value: true,
          type: 'radio',
          options: [{
            value: true,
            text: 'ja'
          }, {
            value: false,
            text: 'nee'
          }],
          validationRules: {
            required
          },
          disabled: false
        },
        inspection: {
          label: 'Onderzoeksput',
          value: false,
          type: 'radio',
          options: [{
            value: true,
            text: 'ja'
          }, {
            value: false,
            text: 'nee'
          }],
          validationRules: {
            required
          },
          disabled: false
        },
        joint_measurement: {
          label: 'Lintvoegmetingen',
          value: false,
          type: 'radio',
          options: [{
            value: true,
            text: 'ja'
          }, {
            value: false,
            text: 'nee'
          }],
          validationRules: {
            required
          },
          disabled: false
        },
        floor_measurement: {
          label: 'Vloer Waterpas',
          value: false,
          type: 'radio',
          options: [{
            value: true,
            text: 'ja'
          }, {
            value: false,
            text: 'nee'
          }],
          validationRules: {
            required
          },
          disabled: false
        },
        note: {
          label: 'Opmerking',
          value: '',
          type: 'textarea',
          validationRules: {},
          disabled: false
        },
      },
      steps: [
        new ProgressStep({
          status: 'active',  
          step: 1,
          icon: 'Step-create-icon.svg'
        }),
        new ProgressStep({
          step: 2,
          icon: 'Step-samples-icon.svg'
        }),
        new ProgressStep({
          step: 3,
          icon: 'Step-verify-icon.svg'
        })
      ]
    }
  },
  computed: {
    ...mapGetters('orgUsers', [
      'getReviewers',
      'getCreators',
      'getUserByEmail'
    ]),
    ...mapGetters('report', [
      'activeReport'
    ]),
    ...mapGetters('org', [
      'organization'
    ]),
    nextStep() {
      let report = this.activeReport || { id: 'id', document_id: 'document_id' };
      return { 
        name: 'edit-report-2', 
        params: { id: report.id, document: report.document_id } 
      }
    },
    headerLabel() {
      return this.activeReport ? this.activeReport.document_id : null
    },
    getReviewerOptions() {
      if (this.getReviewers) {
        return [{
            value: null,
            text: 'Selecteer een reviewer'
          }].concat(this.getReviewers.map(
            this.mapToUserOption
          )
        )
      }
      return [{
        value: null,
        text: 'Er zijn geen reviewers beschikbaar'
      }];
    },
    getCreatorOptions() {
      if (this.getCreators) {
        return [{
            value: null,
            text: 'Selecteer een uitvoerder'
          }].concat(this.getCreators.map(
            this.mapToUserOption
          )
        )
      }
      return [{
        value: null,
        text: 'Er zijn geen uitvoerders beschikbaar'
      }];
    }
  },
  async created() {
    if (this.$route.name === 'new-report') {
      this.prepareEmptyForm()
    } else {
      this.prepareExistingReport()
    }
  },
  /**
   * If we're leaving and heading towards step 2, save the document!
   */
  async beforeRouteLeave(to, from, next) {
    if (
      to.name !== 'edit-report-2' ||
      this.stored === true
    ) {
      next()
    } else {
      // trigger submit
      await this.$refs.form.submit();
      next(false)
    }
  },
  methods: {
    ...mapActions('report', [
      'getReportByIds',
      'updateReport',
      'createReport'
    ]),
    /**
     * Prepare an empty form, for creating a new document
     */
    prepareEmptyForm() {
      // Make the document_name accessible as data
      this.document_name = this.$route.params.document_name

      // Set the creator & reviewer user options (from Vuex)
      this.fields.reviewer.options = this.getReviewerOptions
      this.fields.creator.options = this.getCreatorOptions

      // Pre-select the current user as Creator
      let id = getUserId()
      if (id && this.getCreatorOptions.some(user => {
        return user.value === id
      })) {
        this.fields.creator.value = id
      }

      // If there is only one actual option, select it
      if (this.fields.reviewer.options.length === 2) {
        this.fields.reviewer.value = this.fields.reviewer.options[1].value;
      }
    },
    /**
     * Prepare the fields with data from the active report
     */
    async prepareExistingReport() {
      // Make the document_name accessible as data
      this.document_name = this.$route.params.document

      // Set the creator & reviewer user options (from Vuex)
      this.fields.reviewer.options = this.getReviewerOptions
      this.fields.creator.options = this.getCreatorOptions

      await this.getReportByIds({
        id: this.$route.params.id,
        document: this.$route.params.document
      })

      let report = this.activeReport
      this.setFieldValues({
        document_id: report.document_id,
        type: report.typeNumber ? ''+report.typeNumber : null,
        date: '',
        creator: this.activeReport.creator 
          ? this.activeReport.creator.email 
          : null,
        reviewer: this.activeReport.reviewer 
          ? this.activeReport.reviewer.email 
          : null,
        conform_f3o: report.norm 
          ? report.norm.conform_f3o
          : null,
        inspection: report.inspection,
        joint_measurement: report.joint_measurement,
        floor_measurement: report.floor_measurement,
        note: report.note
      })
    },
    mapToUserOption(user) {
      return {
        value: user.user.email,
        text: user.getUserName()
      }
    },

    /**
     * Handle the creation of the report
     */
    async handleSubmit() {
      this.disableAllFields()
      this.isDisabled = true
      this.feedback = {
        variant: 'info', 
        message: 'Bezig met opslaan van rapport...'
      }

      let values = this.allFieldValues();
      let creator = this.getUserByEmail({ email: values.creator });
      let reviewer = this.getUserByEmail({ email: values.reviewer });
      
      let data = {
        document_id: values.document_id,
        inspection: values.inspection,
        joint_measurement: values.joint_measurement,
        floor_measurement: values.floor_measurement,
        note: values.note,
        status: values.status,

        type: parseInt(values.type),
        document_date: '2019-06-01T20:59:25.988Z', // TODO: formatting
        document_name: this.document_name,
        attribution: {
          reviewer: {
            nick_name: reviewer.getUserName(),
            email: reviewer.user.email
          },
          creator: {
            nick_name: creator.getUserName(),
            email: creator.user.email
          },
          contractor: {
            name: this.organization.name
          }
        },
        norm: {
          conform_f3o: values.conform_f3o
        },
      }
    
      if (this.activeReport) {
        await this.updateReport({ 
          id: this.$route.params.id, 
          document: this.$route.params.document, 
          data 
        })
          .then(this.handleSuccess)
          .catch(this.errorHandler)
      } else {
        await this.createReport(data)
          .then(this.handleSuccess)
          .catch(this.errorHandler)
      }
    },
    handleSuccess() {
      this.stored = true;

      // next();
      this.$router.push({
        name: 'edit-report-2',
        params: {
          id: this.activeReport.id,
          document: this.document_name
        }
      })
    },
    errorHandler(err) {
      this.enableAllFields()
      this.isDisabled = false

      if (err.response && err.response.status === 401) {
        this.feedback = {
          variant: 'danger', 
          message: 'Uw sessie is verlopen'
        }
      } else {
        this.feedback = {
          variant: 'danger', 
          message: 'Onbekende fout. Probeer het later nog eens.'
        }
      }
    }
  }
}
</script>

<style lang="scss">
.ReportForm {
  width: 780px;
  margin: auto;

  &__pane {
    border-radius: 5px;
    border: 1px solid #CED0DA;
    background: white;

    h2 {
      font-size: 24px;
      line-height: 20px;
      color: #3D5372;
      margin-bottom: 31px;
    }
  }
}
</style>