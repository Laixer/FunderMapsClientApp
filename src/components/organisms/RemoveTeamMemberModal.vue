<template>
  <b-modal 
    id="modal-remove-teammember"
    ref="modal" 
    centered 
    okTitle='Verdwijderen'
    cancelTitle='Annuleren'
    @ok="onOk"
    @show="onShow"
    title="Teamlid verwijderen">
    <template slot="default">
      <Feedback :feedback="feedback" />
      Bevestig dat het account van <strong>{{ name }}</strong> verwijderd moet worden. 
      <br />
      <br />
      Let op, dit kan niet ongedaan gemaakt worden.
    </template>
  </b-modal>
</template>

<script>

import Feedback from 'atom/Feedback'
import { isAdmin } from 'service/auth'
import { mapGetters, mapActions } from 'vuex'
import timeout from 'mixin/timeout'

export default {
  components: {
    Feedback
  },
  mixins: [ timeout ],
  props: {
    userId: {
      type: String,
      default: null
    },
    organizationId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      name: '',
      isDisabled: false,
      feedback: {}
    }
  },
  computed: {
    ...mapGetters('orgUsers', ['getUserById']),
    orgUser() {
      return this.getUserById({ id: this.id })
    }
  },
  watch: {
    orgUser(orgUser) {
      if (orgUser) {
        this.name = orgUser.getUserName()
      }
    }
  },
  methods: {
    ...mapActions('orgUsers', ['removeUser', 'adminRemoveUser']),
    onShow() {
      this.feedback = { show: false }
    },
    async onOk(e) {
      e.preventDefault()
      if (this.isDisabled) {
        this.feedback = {
          variant: 'info', 
          message: 'Reeds bezig met verwerken...'
        }
        return;
      }
      this.isDisabled = true;
      this.feedback = {
        variant: 'info', 
        message: 'Bezig met verwerken...'
      }
      
      try {
        // Act according to privileges.
        if (isAdmin()) {
          await this.adminRemoveUser({
            organizationId: this.organizationId,
            userId: this.userId
          });
        } else {
          await this.removeUser({
            userId: this.userId
          });
        }

        this.feedback = {
          variant: 'success',
          message: 'Het teamlid is verwijderd'
        }
        this.setTimeout(() => {
          this.$refs.modal.hide()
          this.isDisabled = false;
        }, 500)
        
      } catch (err) {
        this.isDisabled = false;
        this.feedback = {
          variant: 'danger', 
          message: 'Het teamlid kon niet worden verwijderd'
        }
      }
    }
  }
}
</script>
