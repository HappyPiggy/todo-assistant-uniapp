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
    loading: false,
    lastRefresh: null,
    cacheValid: false // 添加缓存有效性标记
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
    autoSyncInterval: 0, // 秒，设置为0禁用定时同步
    theme: 'light',
    language: 'zh-CN'
  }
})

// 同步相关操作
const syncActions = {
  // 获取用户专属的缓存key
  getUserCacheKey(key) {
    const userId = currentUserId.value
    return userId ? `${key}_${userId}` : key
  },

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
  // 获取用户专属的缓存key  
  getUserCacheKey(key) {
    return syncActions.getUserCacheKey(key)
  },

  // 从缓存获取项目册列表（用户隔离）
  getTodoBooksFromCache() {
    const userId = currentUserId.value
    
    // 如果没有用户ID，返回空
    if (!userId) {
      console.warn('未找到用户ID，无法获取缓存')
      return {
        success: false,
        data: [],
        source: 'no_user'
      }
    }
    console.warn('到用户ID，尝试获取缓存', userId)
    
    // 优先返回内存缓存
    if (state.todoBooks.list.length > 0) {
      // 验证内存缓存是否属于当前用户
      const cacheUserId = uni.getStorageSync(this.getUserCacheKey('cache_user_id'))
      if (cacheUserId === userId) {
        return {
          success: true,
          data: state.todoBooks.list,
          source: 'memory'
        }
      } else {
        // 内存缓存用户不匹配，清空并重新加载
        console.log('内存缓存用户不匹配，清空缓存')
        state.todoBooks.list = []
      }
    }
    
    // 尝试从本地存储获取
    try {
      const cacheKey = this.getUserCacheKey('cached_todobooks')
      const timeKey = this.getUserCacheKey('todobooks_cache_time')
      
      const cachedBooks = uni.getStorageSync(cacheKey)
      const cacheTime = uni.getStorageSync(timeKey)
      
      if (cachedBooks && cacheTime) {
        const cacheAge = Date.now() - new Date(cacheTime).getTime()
        const maxAge = 10 * 60 * 1000 // 10分钟缓存有效期
        
        if (cacheAge < maxAge) {
          state.todoBooks.list = cachedBooks
          // 记录当前缓存的用户ID
          uni.setStorageSync(this.getUserCacheKey('cache_user_id'), userId)
          
          return {
            success: true,
            data: cachedBooks,
            source: 'storage'
          }
        }
      }
    } catch (error) {
      console.warn('读取用户缓存失败:', error)
    }
    
    return {
      success: false,
      data: [],
      source: 'none'
    }
  },

  // 更新项目册缓存（统一事件通知 + 用户隔离）
  updateTodoBooksCache(books) {
    const userId = currentUserId.value
    
    if (!userId) {
      console.warn('未找到用户ID，无法更新缓存')
      return
    }
    
    try {
      // 更新内存缓存
      state.todoBooks.list = books
      state.todoBooks.lastRefresh = new Date().toISOString()
      
      // 更新本地存储缓存（用户隔离）
      const cacheKey = this.getUserCacheKey('cached_todobooks')
      const timeKey = this.getUserCacheKey('todobooks_cache_time')
      const userKey = this.getUserCacheKey('cache_user_id')
      
      uni.setStorageSync(cacheKey, books)
      uni.setStorageSync(timeKey, new Date().toISOString())
      uni.setStorageSync(userKey, userId)
      
      // 更新Map缓存
      state.cache.todoBooks.clear()
      books.forEach(book => {
        state.cache.todoBooks.set(book._id, book)
      })
      
      console.log(`项目册缓存已更新(用户${userId}):`, books.length, '条')
      
      // 统一通过事件系统通知所有页面更新
      console.log('发送 todobooks-cache-updated 事件，数据条数:', books.length)
      uni.$emit('todobooks-cache-updated', books)
      
    } catch (error) {
      console.error('更新用户缓存失败:', error)
    }
  },

  // 加载项目册列表（带缓存优先策略）
  async loadTodoBooks(options = {}, forceRefresh = false) {
    if (state.todoBooks.loading) return state.todoBooks.list
    
    // 如果不强制刷新，先尝试从缓存获取
    if (!forceRefresh) {
      const cached = this.getTodoBooksFromCache()
      if (cached.success) {
        console.log('从缓存加载项目册:', cached.source)
        return cached.data
      }
    }
    
    // 缓存无效或强制刷新，从云端获取
    state.todoBooks.loading = true
    
    try {
      console.log('从云端加载项目册...')
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoBooks(options)
      
      if (result.code === 0) {
        const books = result.data.list || result.data
        this.updateTodoBooksCache(books)
        return books
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('加载项目册失败:', error)
      // 如果网络失败，尝试返回过期缓存
      const cached = this.getTodoBooksFromCache()
      if (cached.data.length > 0) {
        console.log('网络失败，返回过期缓存')
        return cached.data
      }
      throw error
    } finally {
      state.todoBooks.loading = false
    }
  },
  
  // 刷新项目册列表
  async refreshTodoBooks() {
    return await this.loadTodoBooks({ include_archived: false }, true)
  },
  
  // 创建项目册
  async createTodoBook(bookData) {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.createTodoBook(bookData)
      
      if (result.code === 0) {
        // 添加到列表开头
        const newList = [result.data, ...state.todoBooks.list]
        this.updateTodoBooksCache(newList)
        
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('创建项目册失败:', error)
      throw error
    }
  },

  // 更新项目册
  async updateTodoBook(bookId, updateData) {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.updateTodoBook(bookId, updateData)
      
      if (result.code === 0) {
        console.log('updateTodoBook 云函数返回结果:', JSON.stringify(result, null, 2))
        
        // 更新缓存中的项目册
        const index = state.todoBooks.list.findIndex(book => book._id === bookId)
        console.log('找到项目册索引:', index, '总数:', state.todoBooks.list.length)
        
        if (index >= 0) {
          let updatedList = [...state.todoBooks.list]
          
          // 如果云函数返回了完整数据，使用完整数据；否则合并更新数据
          if (result.data && result.data._id) {
            console.log('使用云函数返回的完整数据更新缓存')
            updatedList[index] = result.data
          } else {
            console.log('使用合并数据更新缓存')
            updatedList[index] = { ...updatedList[index], ...updateData }
          }
          
          console.log('更新后的项目册:', JSON.stringify(updatedList[index], null, 2))
          
          // 如果项目册被归档，从列表中移除
          if (updateData.is_archived === true || updatedList[index].is_archived === true) {
            console.log('项目册被归档，从列表中移除')
            updatedList = updatedList.filter(book => book._id !== bookId)
          }
          
          this.updateTodoBooksCache(updatedList)
        } else {
          console.warn('未找到要更新的项目册，bookId:', bookId)
        }
        
        return result.data || updateData
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('更新项目册失败:', error)
      throw error
    }
  },

  // 删除项目册
  async deleteTodoBook(bookId) {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.deleteTodoBook(bookId)
      
      if (result.code === 0) {
        // 从缓存中移除
        const newList = state.todoBooks.list.filter(book => book._id !== bookId)
        this.updateTodoBooksCache(newList)
        
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('删除项目册失败:', error)
      throw error
    }
  },

  // 清除缓存（用户隔离）
  clearTodoBooksCache() {
    const userId = currentUserId.value
    
    if (!userId) {
      console.warn('未找到用户ID，清除所有缓存')
      // 清除内存缓存
      state.todoBooks.list = []
      state.cache.todoBooks.clear()
      return
    }
    
    // 清除当前用户的缓存
    const cacheKey = this.getUserCacheKey('cached_todobooks')
    const timeKey = this.getUserCacheKey('todobooks_cache_time')
    const userKey = this.getUserCacheKey('cache_user_id')
    
    state.todoBooks.list = []
    state.cache.todoBooks.clear()
    uni.removeStorageSync(cacheKey)
    uni.removeStorageSync(timeKey)
    uni.removeStorageSync(userKey)
    
    console.log(`用户${userId}的项目册缓存已清除`)
  },

  // 用户切换时清理缓存
  onUserSwitch(newUserId) {
    console.log('检测到用户切换，清理旧缓存')
    
    // 清空内存缓存
    state.todoBooks.list = []
    state.cache.todoBooks.clear()
    
    // 通知页面用户已切换，需要重新加载
    uni.$emit('user-switched', newUserId)
  },

  // 静默后台同步（不影响当前显示）
  async silentSyncTodoBooks() {
    const userId = currentUserId.value
    
    if (!userId) {
      console.warn('未找到用户ID，无法执行同步')
      return null
    }
    
    try {
      console.log(`开始静默后台同步(用户${userId})...`)
      
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoBooks({ include_archived: false })
      
      if (result.code === 0) {
        const books = result.data.list || result.data
        
        // 更新缓存（会自动通过事件通知页面更新）
        this.updateTodoBooksCache(books)
        
        console.log('静默后台同步完成，缓存已更新')
        return books
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('静默后台同步失败:', error)
      return null
    }
  },

  // 获取缓存状态（用户隔离）
  getCacheStatus() {
    const userId = currentUserId.value
    
    if (!userId) {
      return {
        memory: 0,
        storage: 0,
        lastUpdate: null,
        isValid: false,
        user: null
      }
    }
    
    const memoryCount = state.todoBooks.list.length
    const cacheKey = this.getUserCacheKey('cached_todobooks')
    const timeKey = this.getUserCacheKey('todobooks_cache_time')
    
    const storageData = uni.getStorageSync(cacheKey)
    const storageCount = storageData ? storageData.length : 0
    const cacheTime = uni.getStorageSync(timeKey)
    
    return {
      memory: memoryCount,
      storage: storageCount,
      lastUpdate: cacheTime,
      isValid: memoryCount > 0 || storageCount > 0,
      user: userId
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
            task.completed_at = Date.now()
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
  // 状态（可写）
  state: state,
  
  // 操作方法
  sync: syncActions,
  todoBook: todoBookActions,
  storage: localStorageActions,
  settings: settingsActions,
  
  // 初始化
  init: initStore
}