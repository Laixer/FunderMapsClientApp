<template>
  <Form>
    
    <div class="form-row">
      <FormField 
        v-model="fields.street_name.value"
        v-bind="fields.street_name"
        class="col-md-8" />
      <FormField 
        v-model="fields.building_number.value"
        v-bind="fields.building_number"
        class="col-md-2" />
      <FormField 
        v-model="fields.building_number_suffix.value"
        v-bind="fields.building_number_suffix"
        class="col-md-2" />
    </div>

    <div class="form-row">
      <FormField 
        v-model="fields.foundation_type.value"
        v-bind="fields.foundation_type"
        class="col-md-5" />
      <FormField 
        v-model="fields.substructure.value"
        v-bind="fields.substructure"
        class="col-md-5" />
      <FormField 
        v-model="fields.built_year.value"
        v-bind="fields.built_year"
        class="col-md-2" />
    </div>

    <div class="form-row">
      <FormField 
        v-model="fields.monitoring_well.value"
        v-bind="fields.monitoring_well"
        class="col-md-6" />
      <FormField 
        v-model="fields.cpt.value"
        v-bind="fields.cpt"
        class="col-md-6" />
    </div>

    <Divider />

    <div class="form-row">
      <FormField 
        v-model="fields.foundation_quality.value"
        v-bind="fields.foundation_quality"
        class="col-md-6" />
      <FormField 
        v-model="fields.foundation_recovery_adviced.value"
        v-bind="fields.foundation_recovery_adviced"
        class="col-md-6" />
    </div>

    <div class="form-row">
      <FormField 
        v-model="fields.foundation_damage_cause.value"
        v-bind="fields.foundation_damage_cause"
        class="col-md-6" />
      <FormField 
        v-model="fields.enforcement_term.value"
        v-bind="fields.enforcement_term"
        class="col-md-6" />
    </div>

    <div class="form-row">
      <FormField 
        v-model="fields.base_measurement_level.value"
        v-bind="fields.base_measurement_level"
        class="col-md-3" />
      <FormField 
        v-model="fields.wood_level.value"
        v-bind="fields.wood_level"
        class="col-md-3" />
      <FormField 
        v-model="fields.groundwater_level.value"
        v-bind="fields.groundwater_level"
        class="col-md-3" />
      <FormField 
        v-model="fields.ground_level.value"
        v-bind="fields.ground_level"
        class="col-md-3" />
    </div>

  </Form>
</template>

<script>

import { required, numeric, decimal } from 'vuelidate/lib/validators';
import { 
  // foundationTypeOptions,
  foundationQualityOptions, 
  enforcementTermOptions,
  substructureOptions,
  // foundationDamageCauseOptions,
  BaseMeasurementLevelOptions
} from 'config/enums'

import Divider from 'atom/Divider'
import Form from 'molecule/form/Form'
import FormField from 'molecule/form/FormField'

export default {
  components: {
    Form, FormField, Divider
  },
  props: {
    sample: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      fields: {
        // LINE 1
        street_name: {
          label: 'Straatnaam',
          type: 'text',
          value: '',
          validationRules: {
            required
          }
        },
        building_number: {
          label: 'Nummer',
          type: 'text', 
          value: '',
          validationRules: {
            required,
            numeric
          }
        },
        building_number_suffix: {
          label: 'Toevoeging',
          type: 'text',
          value: '',
          validationRules: {}
        },
        // LINE 2
        foundation_type: {
          label: 'Funderingstype',
          type: 'select',
          value: null,
          options: [{
            value: null,
            text: 'Selecteer een optie'
          }].concat([]), // foundationTypeOptions
          validationRules: {}
        },
        substructure: {
          label: 'Onderbouw',
          type: 'select',
          value: null,
          options: [{
            value: null,
            text: 'Selecteer een optie'
          }].concat(substructureOptions),
          validationRules: {}
        },
        built_year: {
          label: 'Bouwjaar',
          type: 'text', 
          value: '',
          validationRules: {
            numeric
          }
        },
        // LINE 3
        monitoring_well: {
          label: 'Monitoringsput',
          type: 'text',
          value: '',
          validationRules: {}
        },
        cpt: {
          label: 'Sondering',
          type: 'text',
          value: '',
          validationRules: {}
        },
        // DIVIDER 
        // LINE 4
        foundation_quality: {
          label: 'Funderingskwaliteit',
          type: 'select',
          value: null,
          options: [{
            value: null,
            text: 'Selecteer een optie'
          }].concat(foundationQualityOptions),
          validationRules: {}
        },
        foundation_recovery_adviced: {
          label: 'Funderingsherstel advies',
          type: 'radio',
          value: null,
          options: [{
            value: true,
            label: 'Ja'
          }, {
            value: false,
            label: 'Nee'
          }],
          validationRules: {}
        },
        // LINE 5
        foundation_damage_cause: {
          label: 'Oorzaak funderingsschade',
          type: 'select',
          value: null,
          options: [{
            value: null,
            text: 'Selecteer een optie'
          }].concat([]), // foundationDamageCauseOptions
          validationRules: {}
        },
        enforcement_term: {
          label: 'Handhavingstermijn',
          type: 'select',
          value: null,
          options: [{
            value: null,
            text: 'Selecteer een optie'
          }].concat(enforcementTermOptions),
          validationRules: {}
        },
        // LINE 6
        base_measurement_level: {
          label: 'Referentiestelsel',
          type: 'select',
          value: null,
          options: [{
            value: null,
            text: 'Selecteer een optie'
          }].concat(BaseMeasurementLevelOptions),
          validationRules: {}
        },
        wood_level: {
          label: 'Hoogte langshout',
          type: 'text',
          value: '',
          validationRules: {
            decimal
          }
        },
        groundwater_level: {
          label: 'Grondwaterstand',
          type: 'text',
          value: '',
          validationRules: {
            decimal
          }
        },
        ground_level: {
          label: 'Maaiveldhoogte',
          type: 'text',
          value: '',
          validationRules: {
            decimal
          }
        }
      }
    }
  }
}
</script>