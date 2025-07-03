// 全局状态管理
import { reactive, readonly } from 'vue'

// 全局状态
const state = reactive({
  // 同步状态
  sync: {
    status: 'idle', // idle, syncing, success, error
    lastSyncTime: null,
    syncProgress: 0,
    errorMessage: ''
  },
  
  // 项目册数据
  todoBooks: {
    list: [],
    loading: false,
    lastRefresh: null
  },
  
  // 当前项目册详情
  currentBook: {
    info: null,
    tasks: [],
    members: [],
    loading: false
  },
  
  // 本地数据缓存
  cache: {
    todoBooks: new Map(),
    tasks: new Map(),
    lastUpdate: null
  },
  
  // 应用设置
  settings: {
    syncOnStartup: true,
    syncOnBackground: false,
    autoSyncInterval: 300, // 秒
    theme: 'light',
    language: 'zh-CN'
  }
})

// 同步相关操作
const syncActions = {
  // 开始同步
  async startSync(options = {}) {
    state.sync.status = 'syncing'
    state.sync.syncProgress = 0
    state.sync.errorMessage = ''
    
    try {
      // 调用同步云对象
      const syncCo = uniCloud.importObject('sync-co')
      const result = await syncCo.startSync(options)
      
      if (result.code === 0) {
        return result.data.sync_id
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      state.sync.status = 'error'
      state.sync.errorMessage = error.message
      throw error
    }
  },
  
  // 上传本地数据
  async uploadData(syncId, localData) {
    try {
      const syncCo = uniCloud.importObject('sync-co')
      const result = await syncCo.uploadData(syncId, localData)
      
      if (result.code === 0) {
        state.sync.syncProgress = 50
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      state.sync.status = 'error'
      state.sync.errorMessage = error.message
      throw error
    }
  },
  
  // 下载云端数据
  async downloadData(syncId, lastSyncTime) {
    try {
      const syncCo = uniCloud.importObject('sync-co')
      const result = await syncCo.downloadData(syncId, lastSyncTime)
      
      if (result.code === 0) {
        state.sync.syncProgress = 80
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      state.sync.status = 'error'
      state.sync.errorMessage = error.message
      throw error
    }
  },
  
  // 完成同步
  async completeSync(syncId) {
    try {
      const syncCo = uniCloud.importObject('sync-co')
      const result = await syncCo.completeSync(syncId)
      
      if (result.code === 0) {
        state.sync.status = 'success'
        state.sync.syncProgress = 100
        state.sync.lastSyncTime = new Date().toISOString()
        
        // 保存同步时间到本地存储
        uni.setStorageSync('lastSyncTime', state.sync.lastSyncTime)
        
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      state.sync.status = 'error'
      state.sync.errorMessage = error.message
      throw error
    }
  },
  
  // 执行完整同步流程
  async performFullSync() {
    try {
      // 1. 开始同步
      const syncId = await this.startSync({
        sync_type: 'manual',
        device_id: uni.getSystemInfoSync().deviceId
      })
      
      // 2. 准备本地数据
      const localData = {
        todobooks: await localStorageActions.getAllTodoBooks(),
        todoitems: await localStorageActions.getAllTasks()
      }
      
      // 3. 上传本地数据
      await this.uploadData(syncId, localData)
      
      // 4. 下载云端数据
      const cloudData = await this.downloadData(syncId, state.sync.lastSyncTime)
      
      // 5. 合并数据到本地
      await localStorageActions.mergeCloudData(cloudData)
      
      // 6. 完成同步
      await this.completeSync(syncId)
      
      // 7. 刷新界面数据
      await todoBookActions.refreshTodoBooks()
      
      return { success: true }
    } catch (error) {
      console.error('同步失败:', error)
      return { success: false, error: error.message }
    }
  }
}

// 项目册相关操作
const todoBookActions = {
  // 加载项目册列表
  async loadTodoBooks(options = {}) {
    if (state.todoBooks.loading) return
    
    state.todoBooks.loading = true
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoBooks(options)
      
      if (result.code === 0) {
        state.todoBooks.list = result.data
        state.todoBooks.lastRefresh = new Date().toISOString()
        
        // 缓存到本地
        result.data.forEach(book => {
          state.cache.todoBooks.set(book._id, book)
        })
        
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('加载项目册失败:', error)
      throw error
    } finally {
      state.todoBooks.loading = false
    }
  },
  
  // 刷新项目册列表
  async refreshTodoBooks() {
    return await this.loadTodoBooks({ include_archived: false })
  },
  
  // 创建项目册
  async createTodoBook(bookData) {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.createTodoBook(bookData)
      
      if (result.code === 0) {
        // 添加到列表开头
        state.todoBooks.list.unshift(result.data)
        
        // 添加到缓存
        state.cache.todoBooks.set(result.data._id, result.data)
        
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('创建项目册失败:', error)
      throw error
    }
  },
  
  // 加载项目册详情
  async loadBookDetail(bookId) {
    if (state.currentBook.loading) return
    
    state.currentBook.loading = true
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoBookDetail(bookId)
      
      if (result.code === 0) {
        state.currentBook.info = result.data.book
        state.currentBook.tasks = result.data.tasks
        state.currentBook.members = result.data.members
        
        // 缓存任务数据
        result.data.tasks.forEach(task => {
          state.cache.tasks.set(task._id, task)
        })
        
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('加载项目册详情失败:', error)
      throw error
    } finally {
      state.currentBook.loading = false
    }
  },
  
  // 更新任务状态
  async updateTaskStatus(taskId, status) {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.updateTodoItemStatus(taskId, status)
      
      if (result.code === 0) {
        // 更新本地状态
        const task = state.currentBook.tasks.find(t => t._id === taskId)
        if (task) {
          task.status = status
          if (status === 'completed') {
            task.completed_at = new Date()
            task.progress = 100
          } else {
            task.completed_at = null
            task.progress = status === 'in_progress' ? Math.max(task.progress || 0, 10) : 0
          }
        }
        
        // 更新缓存
        if (state.cache.tasks.has(taskId)) {
          const cachedTask = state.cache.tasks.get(taskId)
          Object.assign(cachedTask, task)
        }
        
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('更新任务状态失败:', error)
      throw error
    }
  }
}

// 本地存储相关操作
const localStorageActions = {
  // 获取所有本地项目册
  async getAllTodoBooks() {
    try {
      const books = uni.getStorageSync('todobooks') || []
      return books
    } catch (error) {
      console.error('获取本地项目册失败:', error)
      return []
    }
  },
  
  // 获取所有本地任务
  async getAllTasks() {
    try {
      const tasks = uni.getStorageSync('todoitems') || []
      return tasks
    } catch (error) {
      console.error('获取本地任务失败:', error)
      return []
    }
  },
  
  // 保存项目册到本地
  async saveTodoBook(book) {
    try {
      const books = await this.getAllTodoBooks()
      const index = books.findIndex(b => b._id === book._id)
      
      if (index >= 0) {
        books[index] = book
      } else {
        books.push(book)
      }
      
      uni.setStorageSync('todobooks', books)
    } catch (error) {
      console.error('保存项目册失败:', error)
    }
  },
  
  // 保存任务到本地
  async saveTask(task) {
    try {
      const tasks = await this.getAllTasks()
      const index = tasks.findIndex(t => t._id === task._id)
      
      if (index >= 0) {
        tasks[index] = task
      } else {
        tasks.push(task)
      }
      
      uni.setStorageSync('todoitems', tasks)
    } catch (error) {
      console.error('保存任务失败:', error)
    }
  },
  
  // 合并云端数据
  async mergeCloudData(cloudData) {
    try {
      const { todobooks = [], todoitems = [] } = cloudData
      
      // 合并项目册
      const localBooks = await this.getAllTodoBooks()
      const mergedBooks = this.mergeArrays(localBooks, todobooks, '_id', 'updated_at')
      uni.setStorageSync('todobooks', mergedBooks)
      
      // 合并任务
      const localTasks = await this.getAllTasks()
      const mergedTasks = this.mergeArrays(localTasks, todoitems, '_id', 'updated_at')
      uni.setStorageSync('todoitems', mergedTasks)
      
      // 更新缓存时间
      state.cache.lastUpdate = new Date().toISOString()
      uni.setStorageSync('cacheLastUpdate', state.cache.lastUpdate)
      
    } catch (error) {
      console.error('合并云端数据失败:', error)
    }
  },
  
  // 合并数组数据（处理冲突）
  mergeArrays(localArray, cloudArray, idField, timeField) {
    const merged = [...localArray]
    
    cloudArray.forEach(cloudItem => {
      const localIndex = merged.findIndex(item => item[idField] === cloudItem[idField])
      
      if (localIndex >= 0) {
        const localItem = merged[localIndex]
        const localTime = new Date(localItem[timeField])
        const cloudTime = new Date(cloudItem[timeField])
        
        // 使用更新时间较晚的数据
        if (cloudTime >= localTime) {
          merged[localIndex] = cloudItem
        }
      } else {
        merged.push(cloudItem)
      }
    })
    
    return merged
  }
}

// 设置相关操作
const settingsActions = {
  // 加载设置
  async loadSettings() {
    try {
      const settings = uni.getStorageSync('appSettings')
      if (settings) {
        Object.assign(state.settings, settings)
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  },
  
  // 保存设置
  async saveSettings(newSettings) {
    try {
      Object.assign(state.settings, newSettings)
      uni.setStorageSync('appSettings', state.settings)
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }
}

// 初始化状态
const initStore = async () => {
  try {
    // 加载本地设置
    await settingsActions.loadSettings()
    
    // 加载上次同步时间
    const lastSyncTime = uni.getStorageSync('lastSyncTime')
    if (lastSyncTime) {
      state.sync.lastSyncTime = lastSyncTime
    }
    
    // 加载缓存更新时间
    const cacheLastUpdate = uni.getStorageSync('cacheLastUpdate')
    if (cacheLastUpdate) {
      state.cache.lastUpdate = cacheLastUpdate
    }
    
    console.log('状态管理初始化完成')
  } catch (error) {
    console.error('状态管理初始化失败:', error)
  }
}

// 导出状态和操作
export default {
  // 只读状态
  state: readonly(state),
  
  // 操作方法
  sync: syncActions,
  todoBook: todoBookActions,
  storage: localStorageActions,
  settings: settingsActions,
  
  // 初始化
  init: initStore
}