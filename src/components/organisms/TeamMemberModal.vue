<template>
  <b-modal 
    id="modal-teammember"
    ref="modal" 
    centered 
    @ok="onOk"
    @show="onShow"
    :title="'Teamlid: ' + name">
    <template slot="default">
      <Feedback :feedback="feedback" />
      <Form 
        ref="form" 
        autocomplete="off"
        @error="handleError"
        @submit="handleSubmit">

        <FormField 
          label="Voornaam"
          type="text"
          v-model="fields.given_name.value"
          v-bind="fields.given_name" />

        <FormField 
          label="Achternaam"
          type="text"
          v-model="fields.last_name.value"
          v-bind="fields.last_name" />

        <FormField 
          label="Email"
          type="text"
          v-model="fields.email.value"
          v-bind="fields.email" />

        <FormField 
          label="Functie"
          type="text"
          v-model="fields.job_title.value"
          v-bind="fields.job_title" />

        <FormField 
          label="Telefoon"
          type="text"
          v-model="fields.phone_number.value"
          v-bind="fields.phone_number" />
        <Divider />

        <FormField 
          label="Role"
          type="select"
          v-model="fields.role.value"
          v-bind="fields.role" />
        <!-- <Divider /> -->

        <!-- <FormField 
          label="Password"
          type="password"
          v-model="fields.password.value"
          v-bind="fields.password"
          autocomplete="new-password" /> -->

      </Form>
    </template>
  </b-modal>
</template>

<script>

import { required, minLength, email } from 'vuelidate/lib/validators';

import { image } from 'helper/assets'
import Divider from 'atom/Divider'

import Feedback from 'atom/Feedback'
import Form from 'molecule/form/Form'
import FormField from 'molecule/form/FormField'

import { mapGetters, mapActions } from 'vuex'
import fields from 'mixin/fields';

export default {
  components: {
    Divider, FormField, Form, Feedback
  },
  mixins: [ fields ],
  props: {
    id: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      name: '',
      isDisabled: false,
      feedback: {},
      fields: {
        given_name: {
          value: "",
          validationRules: {
            minLength: minLength(2)
          },
          disabled: false
        },
        last_name: {
          value: "",
          validationRules: {
            minLength: minLength(2)
          },
          disabled: false
        },
        email: {
          value: "",
          placeholder: 'naam@bedrijf.nl',
          validationRules: {
            required, email
          },
          disabled: false
        },
        role: {
          value: null,
          validationRules: {
            required
          },
          disabled: false,
          options: [
            { value: null, text: 'Selecteer een optie' },
            { value: 'Superuser', text: 'Superuser' },
            { value: 'Reader', text: 'Reader' },
          ],
        },
        job_title: {
          value: "",
          validationRules: {
          },
          disabled: false
        },
        phone_number: {
          value: "",
          validationRules: {
          },
          disabled: false
        }
      }
    }
  },
  computed: {
    ...mapGetters('org', [
      'getOrgId'
    ]),
    ...mapGetters('orgUsers', [
      'getUserById'
    ]),
    orgUser() {
      return this.getUserById({ id: this.id })
    }
  },
  watch: {
    orgUser(orgUser) {

      this.setFieldValues([
        { name: 'email', value: orgUser.user.email },
        { name: 'role', value: orgUser.role.name },
        { name: 'given_name', value: orgUser.user.given_name },
        { name: 'last_name', value: orgUser.user.last_name },
        { name: 'job_title', value: orgUser.user.job_title },
        { name: 'phone_number', value: orgUser.user.phone_number }
      ])
      
      this.name = orgUser.getUserName()
    }
  },
  methods: {
    ...mapActions('orgUsers', [
      'updateUser'
    ]),
    image,
    onShow() {
      this.feedback = { show: false }
    },
    onOk(e) {
      e.preventDefault()
      if ( ! this.isDisabled) {
        this.$refs.form.submit()
      }
    },
    async handleSubmit() {
      this.disableAllFields()
      this.feedback = {
        variant: 'info', 
        message: 'Bezig met opslaan...'
      }

      // Make a copy
      let userData = Object.assign({}, this.orgUser.user);
      userData.email = this.fieldValue('email')
      userData.job_title = this.fieldValue('job_title')
      userData.last_name = this.fieldValue('last_name')
      userData.given_name = this.fieldValue('given_name')
      userData.phone_number = this.fieldValue('phone_number')

      // TODO: how to set a role?
      
      try {
        await this.updateUser({
          orgId: this.getOrgId,
          userData
        })
        this.feedback = {
          variant: 'success',
          message: 'De wijzigingen zijn opgeslagen'
        }
        this.$refs.modal.hide()
      } catch (err) {
        console.log(err);
        this.feedback = {
          variant: 'danger', 
          message: 'Wijzigingen zijn niet opgeslagen'
        }
      }
      this.enableAllFields()
    },
    handleError(e) {
      console.log("error", e)
    }
  }
}
</script>

<style>

</style>
