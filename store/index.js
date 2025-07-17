// 全局状态管理
import { reactive } from 'vue'
import { currentUserId } from '@/store/storage.js'

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
  
  // 项目册数据
  todoBooks: {
    list: [],
    loading: false
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

// 基础的todoBook状态操作（数据操作已迁移到 useBookData 组合式函数）
const todoBookActions = {
  // 获取当前列表状态
  getList() {
    return state.todoBooks.list
  },
  
  // 获取加载状态
  getLoading() {
    return state.todoBooks.loading
  },
  
  // 设置加载状态
  setLoading(loading) {
    state.todoBooks.loading = loading
  },
  
  // 清除数据（仅用于用户切换等场景）
  clearTodoBooks() {
    state.todoBooks.list = []
    console.log('项目册数据已清除')
  },

  // 用户切换时清理数据
  onUserSwitch(newUserId) {
    console.log('检测到用户切换，清理数据')
    
    // 清空内存数据
    state.todoBooks.list = []
    
    // 通知页面用户已切换，需要重新加载
    uni.$emit('user-switched', newUserId)
  }
}

// 本地存储相关操作（已被 storage.js 中的 LocalStorageManager 替代）
const localStorageActions = {}

// 设置相关操作（已被 storage.js 中的 LocalStorageManager 替代）
const settingsActions = {}

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
  todoBook: todoBookActions,
  
  // 初始化
  init: initStore
}