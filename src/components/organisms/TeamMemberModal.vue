<template>
  <b-modal 
    id="modal-teammember"
    ref="modal" 
    centered 
    @ok="onOk"
    :title="'Teamlid: ' + name">
    <template slot="default">
      <Feedback :feedback="feedback" />
      <Form 
        ref="form" 
        autocomplete="off"
        @error="handleError"
        @submit="handleSubmit">

        <FormField 
          label="Email"
          type="text"
          v-model="fields.email.value"
          v-bind="fields.email" />
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

import { required,  email } from 'vuelidate/lib/validators';
// minLength,

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
        email: {
          value: "naam@bedrijf.nl",
          validationRules: {
            required, email
          },
          disabled: false
        },
        // password: {
        //   value: '',
        //   validationRules: {
        //     minLength: minLength(6)
        //   },
        //   disabled: false
        // },
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
      this.fields.email.value = orgUser.user.email
      this.fields.role.value = orgUser.role.name
      this.name = orgUser.getUserName()
    }
  },
  methods: {
    ...mapActions('orgUsers', [
      'updateUser'
    ]),
    image,
    onOk(e) {
      e.preventDefault()
      if ( ! this.isDisabled) {
        this.$refs.form.submit()
      }
    },
    async handleSubmit(e) {
      console.log("submit", e)
      

      this.disableAllFields()
      this.feedback = {
        variant: 'info', 
        message: 'Bezig met opslaan...'
      }

      // Make a copy
      let userData = Object.assign({}, this.orgUser.user);
      userData.email = this.fieldValue('email');
      
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
        console.log(err)
        this.feedback = {
          variant: 'danger', 
          message: 'Wijzigingen zijn niet opgeslagen'
        }
      }


// TODO: 
//  - disabled fields
//  - make call
//  - on success: update local user object in store
//  - on success: hide modal: this.$refs.modal.hide()
//  - on error: feedback
// 
// {
//   "given_name": "string",
//   "last_name": "string",
//   "avatar": "string",
//   "job_title": "string",
//   "two_factor_enabled": true,
//   "phone_number_confirmed": true,
//   "email_confirmed": true,
//   "lockout_enabled": true,
//   "id": "string",
//   "user_name": "string",
//   "email": "string",
//   "phone_number": "string",
//   "lockout_end": "2019-06-01T22:44:15.228Z"
// }
      

    },
    handleError(e) {
      console.log("error", e)
    }
  }
}
</script>

<style>

</style>
