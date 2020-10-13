<template>
  <b-modal 
    id="modal-teammember"
    ref="modal" 
    centered 
    okTitle='Opslaan'
    cancelTitle='Annuleren'
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
          v-model="fields.givenName.value"
          v-bind="fields.givenName" />

        <FormField 
          label="Achternaam"
          type="text"
          v-model="fields.lastName.value"
          v-bind="fields.lastName" />

        <FormField 
          label="Email"
          type="text"
          v-model="fields.email.value"
          v-bind="fields.email" />

        <FormField 
          label="Functie"
          type="text"
          v-model="fields.jobTitle.value"
          v-bind="fields.jobTitle" />

        <FormField 
          label="Telefoon"
          type="text"
          v-model="fields.phoneNumber.value"
          v-bind="fields.phoneNumber" />
        <Divider />

        <FormField 
          label="Rol"
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

import { required, minLength /*, email */ } from 'vuelidate/lib/validators';

import { image } from 'helper/assets'
import Divider from 'atom/Divider'

import Feedback from 'atom/Feedback'
import Form from 'molecule/form/Form'
import FormField from 'molecule/form/FormField'

import { mapGetters, mapActions } from 'vuex'
import fields from 'mixin/fields'
import timeout from 'mixin/timeout'

import { userRoles, userRoleToInteger } from 'config/roles'

import { getUserId, isAdmin } from 'service/auth'
import { OrgUserModel } from '../../models/OrgUser'
import { isSuperUser } from '@/services/auth';

export default {
  components: {
    Divider, FormField, Form, Feedback
  },
  mixins: [ fields, timeout ],
  props: {
    userId: {
      type: String,
      default: null,
      required: false
    },
    organizationId: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    return {
      name: '',
      isDisabled: false,
      feedback: {},
      fields: {
        givenName: {
          value: "",
          validationRules: {
            minLength: minLength(2)
          },
          disabled: false
        },
        lastName: {
          value: "",
          validationRules: {
            minLength: minLength(2)
          },
          disabled: false
        },
        email: {
          value: "",
          placeholder: 'naam@bedrijf.nl',
          // validationRules: {
          //   required, email
          // },
          disabled: true
        },
        role: {
          value: null,
          validationRules: {
            required
          },
          disabled: false,
          options: [
            { value: null, text: 'Selecteer een optie' }
          ].concat(userRoles),
        },
        jobTitle: {
          value: "",
          validationRules: {
          },
          disabled: false
        },
        phoneNumber: {
          value: "",
          validationRules: {
          },
          disabled: false
        }
      }
    }
  },
  computed: {
    ...mapGetters('orgUsers', [
      'getUserById'
    ]),
    user() {
      return this.getUserById({ id: this.userId })
    }
  },
  watch: {
    user(user) {
      // TODO This might not work
      if (user){
        this.setFieldValues([
          { name: 'role', value: user.getRoleSlug() },
          { name: 'givenName', value: user.givenName },
          { name: 'lastName', value: user.lastName },
          { name: 'jobTitle', value: user.jobTitle },
          { name: 'phoneNumber', value: user.phoneNumber },
          { name: 'email', value: user.email },
        ])
        
        // FUTURE: Hide the role form when editing self
        // If the active user is the same as the user being edited
        this.fields.role.disabled = this.user.id === getUserId();

        this.name = user.getUserName()
      }
    }
  },
  methods: {
    ...mapActions('orgUsers', [
      'updateUser',
      'updateUserRole',
      'adminUpdateUser',
      'adminuUpdateUserRole'
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
      this.isDisabled = true;
      this.feedback = {
        variant: 'info', 
        message: 'Bezig met opslaan...'
      }
      
      try {
        // Make a copy, and add form field data.
        let userData = Object.assign({}, this.user, this.fieldValues([
          'jobTitle', 
          'lastName', 
          'givenName', 
          'phoneNumber'
        ]));

        // TODO This is a tempfix because strings aren't mapped  to enums in our backend.
        var roleInt = userRoleToInteger({ roleAsEnumText: this.fields.role.value });

        // Act according to user privileges
        // Role update is a separate call.
        if (isAdmin()) {
          await this.adminUpdateUser({
            organizationId: this.organizationId,
            userId: this.userId,
            data: userData
          });
          await this.adminUpdateUserRole({
            organizationId: this.organizationId,
            userId: this.userId,
            role: roleInt
          });
        } else {
          await this.updateUser({
            userId: this.userId,
            data: userData
          });
          await this.updateUserRole({
            organizationId: this.organizationId,
            userId: this.userId,
            role: roleInt
          });
        }
        
        this.feedback = {
          variant: 'success',
          message: 'De wijzigingen zijn opgeslagen'
        }

        this.setTimeout(() => {
          this.$refs.modal.hide()
          this.isDisabled = false
          this.enableAllFields()
        }, 500)
        
      } catch (err) {
        this.feedback = {
          variant: 'danger', 
          message: 'Wijzigingen zijn niet opgeslagen'
        }
        this.isDisabled = false;
        this.enableAllFields()
      }
      
    },
    handleError() {
      this.feedback = {
        variant: 'danger', 
        message: 'Controleer de validatie berichten a.u.b.'
      }
    }
  }
}
</script>
