<script setup lang="ts">
import { onMounted } from 'vue'

import { loginRedirect } from '@/services/oidc'

// Login lives in the auth app (auth.fundermaps.com). The router redirects to
// the OIDC flow before this component renders (the global guard + this route's
// beforeEnter), so this is normally never shown. The onMounted call is a
// defensive fallback, and the template renders nothing so there is no flash of
// a local login page during the hand-off.
onMounted(() => {
  loginRedirect()
})
</script>

<template>
  <div />
</template>
