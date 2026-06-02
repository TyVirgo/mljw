import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { tr } from './i18n/index.js'

const app = createApp(App)
app.config.globalProperties.$tr = tr

app.mount('#app')
