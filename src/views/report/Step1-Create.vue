<template>
  <div class="ReportForm">
    <ProgressSteps :steps="steps" />
    <Form 
      ref="form"
      @submit="handleSubmit"
      class="ReportForm__form mt-5">

      <ReportStepHeader :step="1" />

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
import PrimaryArrowButton from 'atom/navigation/PrimaryArrowButton'
import ReportStepHeader from 'atom/ReportStepHeader'

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
                text: option.label
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
  created() {
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
   * If we're leaving and heading towards step 2, save the document!
   */
  async beforeRouteLeave(to, from, next) {
    if (to.name !== 'edit-report-2') {
      next()
    }
    
    // trigger submit
    await this.$refs.form.submit();

        // next(false);
    // next({
    //   name: 'edit-report-2',
    //   params: {
    //     id: this.activeReport.id,
    //     document: this.document_name
    //   }
    // })
  },
  methods: {
    ...mapActions('report', [
      'createReport'
    ]),
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
        message: 'Bezig met aanmaken van rapport...'
      }

      let values = this.allFieldValues();
      let creator = this.getUserByEmail({ id: values.creator });
      let reviewer = this.getUserByEmail({ id: values.reviewer });

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
      
      await this.createReport(data)
        .catch((err) => {
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
        });
      }
      // response
      // {"id":91063,"document_id":"test-name","inspection":false,"joint_measurement":false,"floor_measurement":false,"note":"","status":0,"type":4,"document_date":"2019-06-01T20:59:25.988Z","document_name":null,"attribution":{"id":18687,"project":null,"reviewer":{"id":30141,"nick_name":"bruce","first_name":"Bruce","middle_name":null,"last_name":"Wayne","email":"batman@gotham.gov","phone":"+19001117774","organization":{"id":85615,"name":"Gotham City"}},"contractor":{"id":85615,"name":"Gotham City"},"creator":{"id":30141,"nick_name":"bruce","first_name":"Bruce","middle_name":null,"last_name":"Wayne","email":"batman@gotham.gov","phone":"+19001117774","organization":{"id":85615,"name":"Gotham City"}},"owner":{"id":85615,"name":"Gotham City"},"project_navigation":null},"norm":{"conform_f3o":true},"access_policy":1,"create_date":"2019-06-09T17:06:59.321842+00:00","update_date":null,"delete_date":null}
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
