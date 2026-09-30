import './style.css'
import './styles/app.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

// A tab left open across a deploy still runs the old build, whose lazy chunks no longer
// exist: the next lazy route fails with "Failed to fetch dynamically imported module"
// (Don, 2026-09-30, after committing two dossiers). Reload once to pick up the new build;
// the timestamp guard stops a reload loop if the chunk is missing for another reason.
const RELOAD_KEY = 'studio:chunk-reload-at'
function reloadForNewBuild(): boolean {
  let last = 0
  try {
    last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
  } catch {
    // storage unavailable: still reload once
  }
  if (Date.now() - last < 60_000) return false
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // ignore
  }
  window.location.reload()
  return true
}
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewBuild()) event.preventDefault()
})
router.onError((err) => {
  if (/Failed to fetch dynamically imported module|Importing a module script failed/.test(String(err?.message ?? err))) {
    reloadForNewBuild()
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
