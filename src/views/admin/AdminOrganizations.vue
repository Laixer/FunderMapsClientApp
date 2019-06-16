<template>
  <div> 
    <ul>
      <li 
        v-for="(org, index) in organisations"
        :key="index + Date.now()"
        @click="handleClick({ id: org.getId() })">
        {{ org.name }} ({{ org.email }})
      </li>
    </ul>
  </div>
</template>

<script>

import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('org', [
      'organisations'
    ])
  },
  created() {
    console.log("Admin Org", this.organisations)
  },
  methods: {
    handleClick({ id }) {
      return function(){
        this.$router.push({
          name: 'admin-organization',
          params: { id }
        })
      }.apply(this)
    }
  }
}
</script>

<style>

</style>
