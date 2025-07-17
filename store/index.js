// 全局状态管理
import { reactive } from 'vue'

// 全局状态
const state = reactive({
  // 同步状态
  sync: {
    status: 'idle', // idle, syncing, success, error
    lastSyncTime: null,
    syncProgress: 0,
    errorMessage: '',
    hasStartupSynced: false // 添加启动同步标记
  },
  
  
  // 应用设置
  settings: {
    syncOnStartup: true,
    syncOnBackground: false,
    autoSyncInterval: 0, // 秒，设置为0禁用定时同步
    theme: 'light',
    language: 'zh-CN'
  }
})

// 同步相关操作
const syncActions = {}


// 初始化状态
const initStore = async () => {
  try {
    // 加载上次同步时间
    const lastSyncTime = uni.getStorageSync('lastSyncTime')
    if (lastSyncTime) {
      state.sync.lastSyncTime = lastSyncTime
    }
    
    
    console.log('状态管理初始化完成')
  } catch (error) {
    console.error('状态管理初始化失败:', error)
  }
}

// 导出状态和操作
export default {
  // 状态（可写）
  state: state,
  
  // 操作方法
  sync: syncActions,
  
  // 初始化
  init: initStore
}