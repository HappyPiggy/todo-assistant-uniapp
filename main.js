
// #ifndef VUE3
import Vue from 'vue'
import App from './App'

Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
    ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import App from './App.vue'
import store from './store/index.js'
import { storageManager } from './store/storage.js'
import { syncManager } from './store/sync.js'

export function createApp() {
  const app = createSSRApp(App)
  
  // 挂载全局状态管理
  app.config.globalProperties.$store = store
  app.config.globalProperties.$storage = storageManager
  app.config.globalProperties.$sync = syncManager
  
  // 初始化状态管理
  store.init()
  
  return {
    app
  }
}
// #endif