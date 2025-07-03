// 本地存储管理模块
import { reactive } from 'vue'

// 存储键名常量
const STORAGE_KEYS = {
  TODOBOOKS: 'todobooks',
  TODOITEMS: 'todoitems',
  USER_SETTINGS: 'appSettings',
  SYNC_STATUS: 'syncStatus',
  LAST_SYNC_TIME: 'lastSyncTime',
  CACHE_TIMESTAMP: 'cacheTimestamp',
  OFFLINE_CHANGES: 'offlineChanges',
  APP_VERSION: 'appVersion'
}

// 存储状态
const storageState = reactive({
  isReady: false,
  cacheSize: 0,
  lastCleanup: null,
  storageQuota: {
    used: 0,
    total: 0,
    available: 0
  }
})

class LocalStorageManager {
  constructor() {
    this.maxCacheSize = 50 * 1024 * 1024 // 50MB
    this.compressionEnabled = true
    this.encryptionEnabled = false
    
    this.init()
  }

  // 初始化存储管理器
  async init() {
    try {
      await this.checkStorageQuota()
      await this.cleanupExpiredData()
      await this.migrateData()
      
      storageState.isReady = true
      console.log('本地存储管理器初始化完成')
    } catch (error) {
      console.error('存储管理器初始化失败:', error)
    }
  }

  // 检查存储配额
  async checkStorageQuota() {
    try {
      const storageInfo = uni.getStorageInfoSync()
      
      storageState.storageQuota = {
        used: storageInfo.currentSize || 0,
        total: storageInfo.limitSize || 10 * 1024 * 1024, // 10MB 默认
        available: (storageInfo.limitSize || 10 * 1024 * 1024) - (storageInfo.currentSize || 0)
      }
      
      // 如果存储空间不足，触发清理
      if (storageState.storageQuota.available < 1024 * 1024) { // 小于1MB
        await this.performStorageCleanup()
      }
      
    } catch (error) {
      console.warn('无法检查存储配额:', error)
    }
  }

  // 数据迁移
  async migrateData() {
    try {
      const currentVersion = uni.getStorageSync(STORAGE_KEYS.APP_VERSION)
      const targetVersion = '1.0.0' // 当前应用版本
      
      if (currentVersion !== targetVersion) {
        await this.performDataMigration(currentVersion, targetVersion)
        uni.setStorageSync(STORAGE_KEYS.APP_VERSION, targetVersion)
      }
    } catch (error) {
      console.error('数据迁移失败:', error)
    }
  }

  // 执行数据迁移
  async performDataMigration(fromVersion, toVersion) {
    console.log(`数据迁移: ${fromVersion} -> ${toVersion}`)
    
    // 根据版本执行相应的迁移逻辑
    if (!fromVersion) {
      // 首次安装，无需迁移
      return
    }
    
    // 示例：v0.9.x -> v1.0.0 的迁移
    if (fromVersion.startsWith('0.9')) {
      await this.migrateFromV09ToV10()
    }
  }

  // v0.9.x 到 v1.0.0 的迁移示例
  async migrateFromV09ToV10() {
    try {
      // 迁移项目册数据结构
      const oldBooks = uni.getStorageSync('old_todobooks') || []
      const newBooks = oldBooks.map(book => ({
        ...book,
        // 添加新字段
        last_activity_at: book.updated_at,
        is_archived: false,
        share_type: 'private'
      }))
      
      uni.setStorageSync(STORAGE_KEYS.TODOBOOKS, newBooks)
      uni.removeStorageSync('old_todobooks')
      
      console.log('项目册数据迁移完成')
    } catch (error) {
      console.error('v0.9到v1.0迁移失败:', error)
    }
  }

  // ===== 项目册操作 =====
  
  // 获取所有项目册
  async getTodoBooks() {
    try {
      const data = uni.getStorageSync(STORAGE_KEYS.TODOBOOKS)
      return this.deserializeData(data) || []
    } catch (error) {
      console.error('获取项目册失败:', error)
      return []
    }
  }

  // 保存项目册
  async saveTodoBook(book) {
    try {
      const books = await this.getTodoBooks()
      const index = books.findIndex(b => b._id === book._id)
      
      // 添加时间戳
      const timestamp = new Date().toISOString()
      book.updated_at = timestamp
      
      if (index >= 0) {
        books[index] = book
      } else {
        book.created_at = book.created_at || timestamp
        books.push(book)
      }
      
      await this.setStorageData(STORAGE_KEYS.TODOBOOKS, books)
      return book
    } catch (error) {
      console.error('保存项目册失败:', error)
      throw error
    }
  }

  // 删除项目册
  async deleteTodoBook(bookId) {
    try {
      const books = await this.getTodoBooks()
      const filtered = books.filter(b => b._id !== bookId)
      
      await this.setStorageData(STORAGE_KEYS.TODOBOOKS, filtered)
      
      // 同时删除相关任务
      await this.deleteTasksByBookId(bookId)
      
      return true
    } catch (error) {
      console.error('删除项目册失败:', error)
      throw error
    }
  }

  // ===== 任务操作 =====
  
  // 获取所有任务
  async getTodoItems(bookId = null) {
    try {
      const data = uni.getStorageSync(STORAGE_KEYS.TODOITEMS)
      let tasks = this.deserializeData(data) || []
      
      if (bookId) {
        tasks = tasks.filter(task => task.todobook_id === bookId)
      }
      
      return tasks
    } catch (error) {
      console.error('获取任务失败:', error)
      return []
    }
  }

  // 保存任务
  async saveTodoItem(task) {
    try {
      const tasks = await this.getTodoItems()
      const index = tasks.findIndex(t => t._id === task._id)
      
      // 添加时间戳
      const timestamp = new Date().toISOString()
      task.updated_at = timestamp
      task.last_activity_at = timestamp
      
      if (index >= 0) {
        tasks[index] = task
      } else {
        task.created_at = task.created_at || timestamp
        tasks.push(task)
      }
      
      await this.setStorageData(STORAGE_KEYS.TODOITEMS, tasks)
      return task
    } catch (error) {
      console.error('保存任务失败:', error)
      throw error
    }
  }

  // 删除任务
  async deleteTodoItem(taskId) {
    try {
      const tasks = await this.getTodoItems()
      const filtered = tasks.filter(t => t._id !== taskId)
      
      await this.setStorageData(STORAGE_KEYS.TODOITEMS, filtered)
      return true
    } catch (error) {
      console.error('删除任务失败:', error)
      throw error
    }
  }

  // 根据项目册ID删除任务
  async deleteTasksByBookId(bookId) {
    try {
      const tasks = await this.getTodoItems()
      const filtered = tasks.filter(t => t.todobook_id !== bookId)
      
      await this.setStorageData(STORAGE_KEYS.TODOITEMS, filtered)
      return true
    } catch (error) {
      console.error('删除项目册任务失败:', error)
      throw error
    }
  }

  // ===== 设置操作 =====
  
  // 获取应用设置
  async getAppSettings() {
    try {
      const data = uni.getStorageSync(STORAGE_KEYS.USER_SETTINGS)
      return this.deserializeData(data) || {
        syncOnStartup: true,
        syncOnBackground: false,
        autoSyncInterval: 300,
        theme: 'light',
        language: 'zh-CN',
        conflictResolution: 'server_wins',
        notificationEnabled: true
      }
    } catch (error) {
      console.error('获取应用设置失败:', error)
      return {}
    }
  }

  // 保存应用设置
  async saveAppSettings(settings) {
    try {
      await this.setStorageData(STORAGE_KEYS.USER_SETTINGS, settings)
      return settings
    } catch (error) {
      console.error('保存应用设置失败:', error)
      throw error
    }
  }

  // ===== 离线变更管理 =====
  
  // 获取离线变更
  async getOfflineChanges() {
    try {
      const data = uni.getStorageSync(STORAGE_KEYS.OFFLINE_CHANGES)
      return this.deserializeData(data) || []
    } catch (error) {
      console.error('获取离线变更失败:', error)
      return []
    }
  }

  // 添加离线变更
  async addOfflineChange(change) {
    try {
      const changes = await this.getOfflineChanges()
      
      // 检查是否已存在相同的变更
      const existingIndex = changes.findIndex(c => 
        c.entityType === change.entityType && 
        c.entityId === change.entityId
      )
      
      if (existingIndex >= 0) {
        // 合并变更
        changes[existingIndex] = {
          ...changes[existingIndex],
          ...change,
          timestamp: Date.now()
        }
      } else {
        changes.push({
          ...change,
          id: this.generateId(),
          timestamp: Date.now()
        })
      }
      
      await this.setStorageData(STORAGE_KEYS.OFFLINE_CHANGES, changes)
      return changes
    } catch (error) {
      console.error('添加离线变更失败:', error)
      throw error
    }
  }

  // 清除离线变更
  async clearOfflineChanges(changeIds = null) {
    try {
      if (changeIds) {
        const changes = await this.getOfflineChanges()
        const filtered = changes.filter(c => !changeIds.includes(c.id))
        await this.setStorageData(STORAGE_KEYS.OFFLINE_CHANGES, filtered)
      } else {
        await this.setStorageData(STORAGE_KEYS.OFFLINE_CHANGES, [])
      }
      
      return true
    } catch (error) {
      console.error('清除离线变更失败:', error)
      throw error
    }
  }

  // ===== 缓存管理 =====
  
  // 设置缓存数据
  async setCacheData(key, data, expireTime = 24 * 60 * 60 * 1000) { // 默认24小时过期
    try {
      const cacheItem = {
        data: this.serializeData(data),
        timestamp: Date.now(),
        expireTime: Date.now() + expireTime
      }
      
      uni.setStorageSync(`cache_${key}`, cacheItem)
      return true
    } catch (error) {
      console.error('设置缓存失败:', error)
      return false
    }
  }

  // 获取缓存数据
  async getCacheData(key) {
    try {
      const cacheItem = uni.getStorageSync(`cache_${key}`)
      
      if (!cacheItem) {
        return null
      }
      
      // 检查是否过期
      if (Date.now() > cacheItem.expireTime) {
        uni.removeStorageSync(`cache_${key}`)
        return null
      }
      
      return this.deserializeData(cacheItem.data)
    } catch (error) {
      console.error('获取缓存失败:', error)
      return null
    }
  }

  // 清理过期数据
  async cleanupExpiredData() {
    try {
      const storageInfo = uni.getStorageInfoSync()
      const keys = storageInfo.keys || []
      
      for (const key of keys) {
        if (key.startsWith('cache_')) {
          const cacheItem = uni.getStorageSync(key)
          
          if (cacheItem && cacheItem.expireTime && Date.now() > cacheItem.expireTime) {
            uni.removeStorageSync(key)
          }
        }
      }
      
      storageState.lastCleanup = new Date().toISOString()
      console.log('过期数据清理完成')
    } catch (error) {
      console.error('清理过期数据失败:', error)
    }
  }

  // 执行存储清理
  async performStorageCleanup() {
    try {
      // 1. 清理过期缓存
      await this.cleanupExpiredData()
      
      // 2. 清理旧的离线变更（超过7天）
      const changes = await this.getOfflineChanges()
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const validChanges = changes.filter(c => c.timestamp > oneWeekAgo)
      
      if (validChanges.length < changes.length) {
        await this.setStorageData(STORAGE_KEYS.OFFLINE_CHANGES, validChanges)
      }
      
      // 3. 压缩大数据
      await this.compressLargeData()
      
      console.log('存储清理完成')
    } catch (error) {
      console.error('存储清理失败:', error)
    }
  }

  // 压缩大数据
  async compressLargeData() {
    if (!this.compressionEnabled) return
    
    try {
      // 压缩项目册数据
      const books = await this.getTodoBooks()
      if (books.length > 100) {
        await this.setStorageData(STORAGE_KEYS.TODOBOOKS, books, true)
      }
      
      // 压缩任务数据
      const tasks = await this.getTodoItems()
      if (tasks.length > 500) {
        await this.setStorageData(STORAGE_KEYS.TODOITEMS, tasks, true)
      }
      
    } catch (error) {
      console.error('数据压缩失败:', error)
    }
  }

  // ===== 数据序列化/反序列化 =====
  
  // 序列化数据
  serializeData(data, compress = false) {
    try {
      let serialized = JSON.stringify(data)
      
      if (compress && this.compressionEnabled) {
        // 简单的压缩（实际项目中可以使用更好的压缩算法）
        serialized = this.simpleCompress(serialized)
      }
      
      return serialized
    } catch (error) {
      console.error('数据序列化失败:', error)
      return null
    }
  }

  // 反序列化数据
  deserializeData(serialized) {
    try {
      if (!serialized) return null
      
      // 检查是否是压缩数据
      if (typeof serialized === 'string' && serialized.startsWith('COMPRESSED:')) {
        serialized = this.simpleDecompress(serialized)
      }
      
      return JSON.parse(serialized)
    } catch (error) {
      console.error('数据反序列化失败:', error)
      return null
    }
  }

  // 简单压缩
  simpleCompress(str) {
    // 这里只是示例，实际应用中应使用更好的压缩算法
    return 'COMPRESSED:' + str
  }

  // 简单解压
  simpleDecompress(compressed) {
    return compressed.replace('COMPRESSED:', '')
  }

  // ===== 工具方法 =====
  
  // 设置存储数据
  async setStorageData(key, data, compress = false) {
    try {
      const serialized = this.serializeData(data, compress)
      uni.setStorageSync(key, serialized)
      
      // 更新缓存大小统计
      await this.updateCacheSize()
      
      return true
    } catch (error) {
      console.error('设置存储数据失败:', error)
      throw error
    }
  }

  // 更新缓存大小统计
  async updateCacheSize() {
    try {
      const storageInfo = uni.getStorageInfoSync()
      storageState.cacheSize = storageInfo.currentSize || 0
    } catch (error) {
      console.warn('更新缓存大小失败:', error)
    }
  }

  // 生成唯一ID
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取存储状态
  getStorageStatus() {
    return {
      isReady: storageState.isReady,
      cacheSize: storageState.cacheSize,
      lastCleanup: storageState.lastCleanup,
      quota: storageState.storageQuota
    }
  }

  // 导出数据
  async exportData() {
    try {
      const data = {
        todobooks: await this.getTodoBooks(),
        todoitems: await this.getTodoItems(),
        settings: await this.getAppSettings(),
        timestamp: new Date().toISOString(),
        version: uni.getStorageSync(STORAGE_KEYS.APP_VERSION)
      }
      
      return data
    } catch (error) {
      console.error('导出数据失败:', error)
      throw error
    }
  }

  // 导入数据
  async importData(data) {
    try {
      if (data.todobooks) {
        await this.setStorageData(STORAGE_KEYS.TODOBOOKS, data.todobooks)
      }
      
      if (data.todoitems) {
        await this.setStorageData(STORAGE_KEYS.TODOITEMS, data.todoitems)
      }
      
      if (data.settings) {
        await this.setStorageData(STORAGE_KEYS.USER_SETTINGS, data.settings)
      }
      
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      throw error
    }
  }
}

// 导出存储管理器实例
export const storageManager = new LocalStorageManager()

// 导出存储键名和状态
export {
  STORAGE_KEYS,
  storageState
}