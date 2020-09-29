<template>
  <div class="ReportForm">
    <ProgressSteps :steps="steps" />
    <div 
      v-if="activeReport"
      class="ReportForm__form mt-5">

      <ReportStepHeader 
        :step="2"
        :label="activeReport.documentId">
        <b-button 
          variant="light" 
          class="font-weight-bold d-flex align-items-center"
          @click="handleAddSample">
          <img :src='icon("Plus-icon.svg")' width="11" height="11" /> 
          <span class="ml-1">Adres toevoegen</span>
        </b-button>
      </ReportStepHeader>

      <div>  
        <Feedback :feedback="feedback" />
        <div 
          v-if="samples.length !== 0" 
          class="Report__samples">  

          <Sample  
            v-for="(sample, index) in samples"
            :ref="'sample_'+index" 
            :key="index + '-' + Date.now()" 
            :sample="sample"
            :editMode="true"
            @stored="handleStored" />

        </div>
        <div 
          v-else-if="nosamples"
          class="text-center mt-4">
          Deze rapportage bevat nog geen adressen
        </div>
        <div 
          class="text-center mt-4"
          v-else>
          De addres gegevens worden geladen...
        </div>
      </div>
    </div>

    <div 
      v-if="!activeReport" 
      class="d-flex w-100 h-100 align-items-center justify-content-center mt-5">
      <span v-if="!feedback.message">
        Het rapport wordt geladen. We halen het rapport hier opnieuw op 
        om te voorkomen dat er gewerkt wordt met verouderde data.
      </span>
      <Feedback :feedback="feedback" />
    </div>

    <div class="d-flex align-items-center justify-content-center mt-4">
      <BackButton 
        :disabled="isDisabled"
        :to="previousStep"
        class="mr-3"
        label="Vorige" />
      <PrimaryArrowButton 
        :disabled="isDisabled"
        @click="handleSaveSamplesAndNextStep"
        label="Volgende" />
    </div>

  </div>
</template>

<script>
import ProgressSteps from 'molecule/ProgressSteps'
import ProgressStep from 'model/ProgressStep'
import Feedback from 'atom/Feedback'
import ReportStepHeader from 'atom/ReportStepHeader'
import PrimaryArrowButton from 'atom/navigation/PrimaryArrowButton'
import BackButton from 'atom/navigation/BackButton'
import Sample from 'organism/Sample'

import { mapActions, mapGetters } from 'vuex'
import { icon } from 'helper/assets'
import { isSuperUser, canWrite } from 'service/auth'
import { EventBus } from 'utils/eventBus.js'

export default {
  name: 'Step2',
  components: {
    Feedback, ProgressSteps, 
    ReportStepHeader, PrimaryArrowButton,
    Sample, BackButton
  },
  data() {
    return {
      countdownToNextPage: false,
      countdownToNewSample: false,
      feedback: {},
      nosamples: false,
      isDisabled: false,
      steps: [
        new ProgressStep({
          status: 'passed',  
          step: 1,
          icon: 'Step-create-icon.svg'
        }),
        new ProgressStep({
          status: 'active',
          step: 2,
          icon: 'Step-samples-icon.svg'
        }),
        new ProgressStep({
          status: 'disabled',
          step: 3,
          icon: 'Step-verify-icon.svg'
        })
      ]
    }
  },
  computed: {
    ...mapGetters('report', [
      'activeReport'
    ]),
    ...mapGetters('samples', [
      'samples'
    ]),
    previousStep() {
      let report = this.activeReport ? this.activeReport : { id: 'id', documentId: 'document' }
      return { name: 'edit-report-1', params: { 
        id: report.id, 
        document: report.documentFile
      } }
    },
    nextStep() {
      let report = this.activeReport ? this.activeReport : { id: 'id', documentId: 'document' }
      return { name: 'edit-report-3', params: { 
        id: report.id, 
        document: report.documentId 
      } }
    }
  },
  async created() {
    try {
      if (!canWrite()) {

        console.log('We !canWrite')

        await this.$router.push({
          name: 'view-report',
          params: this.$route.params
        })
        return;
      }

      await this.getReportById({
        id: this.$route.params.id
      })

      if (
        (this.activeReport.isPendingReview() ||
        this.activeReport.isApproved()) && 
        !isSuperUser()
      ) {
        await this.$router.push({
          name: 'view-report',
          params: this.$route.params
        })
        return;
      }
      
      EventBus.$on('save-report', this.handleSaveSamplesAndNextStep)

      await this.getSamples({ inquiryId: this.activeReport.id })

      if (this.samples.length === 0) {
        this.nosamples = true
      }
      
    } catch(err) {
      this.feedback = {
        variant: 'danger',
        message: 'Het opgevraagde rapport kan niet gevonden worden'
      }
    }
  },
  beforeDestroy() {
    this.clearActiveReport()
    this.clearSamples()

    EventBus.$off('save-report', this.handleSaveSamplesAndNextStep)
  },
  methods: {
    icon,
    ...mapActions('report', [
      'getReportById',
      'clearActiveReport'
    ]),
    ...mapActions('samples', [
      'getSamples',
      'clearSamples',
      'addUnsavedSample'
    ]),
    handleAddSample() {
      this.countdownToNewSample = this.samples.length

      console.log('handleAddSample this.countdownToNewSample', this.countdownToNewSample)

      if (this.countdownToNewSample === 0) {
        console.log('handleAddSample > this.addUnsavedSample()')
        this.addUnsavedSample()
      } else {
        console.log('handleAddSample > this.saveAllSamples()')
        this.saveAllSamples() 
      }
    },
    async saveAllSamples() {
      return await Promise.all(this.samples.map( async (sample, index) => {
        return await this.$refs['sample_'+index][0].save()
      }))
    },
    handleSaveSamplesAndNextStep() {
      // TODO Is this in the right place?
      if (this.samples.length === 0) {
        console.log('Blocking next step in Step2.handleSaveSamplesAndNextStep()')
        return;
      }

      // For each saved sample we count down via an event handler (this.handleStored). Once this countdown hits 0, we navigate.
      this.countdownToNextPage = this.samples.length

      // No samples to store
      if (this.countdownToNextPage === 0) {
        this.$router.push(this.nextStep)
      } else {
        this.saveAllSamples()
      }
    },
    /**
     * If we're counting down, and the submit event was a success, 
     * count down, until we reach the end and can go to the next page.
     * 
     * One mistake and we cancel the countdown.
     */
    handleStored(payload) {
      if (this.countdownToNextPage !== false && payload.success) {
        this.countdownToNextPage = this.countdownToNextPage - 1
        if (this.countdownToNextPage === 0) {
          this.$router.push(this.nextStep)
        }
      } else if (payload.success === false) {
        this.countdownToNextPage = false
      }

      if (this.countdownToNewSample !== false && payload.success) {
        this.countdownToNewSample = this.countdownToNewSample - 1
        if (this.countdownToNewSample === 0) {
          this.addUnsavedSample()
        }
      } else if (payload.success === false) {
        this.countdownToNewSample = false
      }
    }
  }
}
</script>