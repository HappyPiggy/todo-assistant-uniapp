// 数据同步管理模块
import { reactive } from 'vue'

// 同步状态
const syncState = reactive({
  isOnline: true,
  isSyncing: false,
  syncQueue: [],
  conflictItems: [],
  lastSyncTime: null,
  autoSyncTimer: null
})

// 同步策略配置
const SYNC_STRATEGIES = {
  // 立即同步
  IMMEDIATE: 'immediate',
  // 延迟同步
  DELAYED: 'delayed',
  // 批量同步
  BATCH: 'batch',
  // 手动同步
  MANUAL: 'manual'
}

// 数据变更类型
const CHANGE_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
}

class SyncManager {
  constructor() {
    this.pendingChanges = new Map()
    this.conflictResolver = new ConflictResolver()
    this.retryCount = 0
    this.maxRetries = 3
    
    this.initNetworkListener()
    this.initAutoSync()
  }

  // 初始化网络监听
  initNetworkListener() {
    // 监听网络状态变化
    uni.onNetworkStatusChange((res) => {
      syncState.isOnline = res.isConnected
      
      if (res.isConnected && syncState.syncQueue.length > 0) {
        // 网络恢复时，处理离线期间的变更
        this.processPendingChanges()
      }
    })
    
    // 获取当前网络状态
    uni.getNetworkType({
      success: (res) => {
        syncState.isOnline = res.networkType !== 'none'
      }
    })
  }

  // 初始化自动同步
  initAutoSync() {
    const settings = uni.getStorageSync('appSettings') || {}
    
    if (settings.syncOnStartup) {
      // 应用启动时同步
      setTimeout(() => {
        this.performSync({ strategy: SYNC_STRATEGIES.DELAYED })
      }, 2000)
    }
    
    if (settings.autoSyncInterval > 0) {
      // 定时自动同步
      this.startAutoSync(settings.autoSyncInterval)
    }
  }

  // 开始自动同步
  startAutoSync(interval) {
    this.stopAutoSync()
    
    syncState.autoSyncTimer = setInterval(() => {
      if (syncState.isOnline && !syncState.isSyncing) {
        this.performSync({ strategy: SYNC_STRATEGIES.BATCH })
      }
    }, interval * 1000)
  }

  // 停止自动同步
  stopAutoSync() {
    if (syncState.autoSyncTimer) {
      clearInterval(syncState.autoSyncTimer)
      syncState.autoSyncTimer = null
    }
  }

  // 记录数据变更
  recordChange(type, entityType, entityId, data, strategy = SYNC_STRATEGIES.DELAYED) {
    const change = {
      id: this.generateChangeId(),
      type,
      entityType,
      entityId,
      data,
      timestamp: Date.now(),
      strategy,
      retryCount: 0
    }
    
    // 合并相同实体的变更
    const existingKey = `${entityType}:${entityId}`
    if (this.pendingChanges.has(existingKey)) {
      const existing = this.pendingChanges.get(existingKey)
      // 如果是连续的更新操作，只保留最新的
      if (existing.type === CHANGE_TYPES.UPDATE && type === CHANGE_TYPES.UPDATE) {
        change.data = { ...existing.data, ...data }
      }
    }
    
    this.pendingChanges.set(existingKey, change)
    
    // 根据策略处理同步
    this.handleSyncStrategy(change)
  }

  // 处理同步策略
  handleSyncStrategy(change) {
    switch (change.strategy) {
      case SYNC_STRATEGIES.IMMEDIATE:
        if (syncState.isOnline) {
          this.syncSingleChange(change)
        } else {
          syncState.syncQueue.push(change)
        }
        break
        
      case SYNC_STRATEGIES.DELAYED:
        syncState.syncQueue.push(change)
        // 延迟3秒后同步
        setTimeout(() => {
          this.processPendingChanges()
        }, 3000)
        break
        
      case SYNC_STRATEGIES.BATCH:
        syncState.syncQueue.push(change)
        break
        
      case SYNC_STRATEGIES.MANUAL:
        // 手动同步，不自动处理
        break
    }
  }

  // 执行同步
  async performSync(options = {}) {
    if (syncState.isSyncing || !syncState.isOnline) {
      return { success: false, reason: 'already_syncing_or_offline' }
    }
    
    syncState.isSyncing = true
    this.retryCount = 0
    
    try {
      // 1. 收集所有待同步的变更
      const changes = Array.from(this.pendingChanges.values())
      
      if (changes.length === 0 && !options.force) {
        return { success: true, message: 'no_changes' }
      }
      
      // 2. 开始云端同步
      const syncCo = uniCloud.importObject('sync-co')
      const syncResult = await syncCo.startSync({
        sync_type: options.strategy || 'manual',
        device_id: uni.getSystemInfoSync().deviceId,
        force: options.force
      })
      
      if (syncResult.code !== 0) {
        throw new Error(syncResult.message)
      }
      
      const syncId = syncResult.data.sync_id
      
      // 3. 上传本地变更
      if (changes.length > 0) {
        const uploadData = this.prepareUploadData(changes)
        const uploadResult = await syncCo.uploadData(syncId, uploadData)
        
        if (uploadResult.code !== 0) {
          throw new Error(uploadResult.message)
        }
      }
      
      // 4. 下载云端数据
      const downloadResult = await syncCo.downloadData(syncId, syncState.lastSyncTime)
      
      if (downloadResult.code !== 0) {
        throw new Error(downloadResult.message)
      }
      
      // 5. 处理数据冲突
      const conflicts = await this.detectConflicts(downloadResult.data, changes)
      if (conflicts.length > 0) {
        const resolvedData = await this.conflictResolver.resolve(conflicts)
        await this.applyResolvedData(resolvedData)
      } else {
        await this.mergeCloudData(downloadResult.data)
      }
      
      // 6. 完成同步
      const completeResult = await syncCo.completeSync(syncId)
      
      if (completeResult.code === 0) {
        // 清除已同步的变更
        this.clearSyncedChanges(changes)
        
        // 更新同步时间
        syncState.lastSyncTime = new Date().toISOString()
        uni.setStorageSync('lastSyncTime', syncState.lastSyncTime)
        
        return { success: true, data: completeResult.data }
      } else {
        throw new Error(completeResult.message)
      }
      
    } catch (error) {
      console.error('同步失败:', error)
      
      // 重试机制
      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        console.log(`同步重试第${this.retryCount}次`)
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this.performSync(options))
          }, Math.pow(2, this.retryCount) * 1000) // 指数退避
        })
      }
      
      return { success: false, error: error.message }
    } finally {
      syncState.isSyncing = false
    }
  }

  // 处理待同步变更
  async processPendingChanges() {
    if (syncState.syncQueue.length === 0 || !syncState.isOnline) {
      return
    }
    
    // 获取队列中的变更
    const changes = [...syncState.syncQueue]
    syncState.syncQueue = []
    
    // 批量同步
    return this.performSync({ strategy: SYNC_STRATEGIES.BATCH, changes })
  }

  // 准备上传数据
  prepareUploadData(changes) {
    const uploadData = {
      todobooks: [],
      todoitems: []
    }
    
    changes.forEach(change => {
      switch (change.entityType) {
        case 'todobook':
          uploadData.todobooks.push({
            action: change.type,
            data: change.data
          })
          break
          
        case 'todoitem':
          uploadData.todoitems.push({
            action: change.type,
            data: change.data
          })
          break
      }
    })
    
    return uploadData
  }

  // 检测数据冲突
  async detectConflicts(cloudData, localChanges) {
    const conflicts = []
    
    // 检查项目册冲突
    if (cloudData.todobooks) {
      cloudData.todobooks.forEach(cloudBook => {
        const localChange = localChanges.find(c => 
          c.entityType === 'todobook' && 
          c.entityId === cloudBook._id &&
          c.type === CHANGE_TYPES.UPDATE
        )
        
        if (localChange) {
          const localTime = new Date(localChange.data.updated_at)
          const cloudTime = new Date(cloudBook.updated_at)
          
          // 如果云端数据更新时间晚于本地变更时间，存在冲突
          if (Math.abs(cloudTime - localTime) < 1000) { // 1秒内认为是冲突
            conflicts.push({
              type: 'todobook',
              id: cloudBook._id,
              local: localChange.data,
              cloud: cloudBook
            })
          }
        }
      })
    }
    
    // 检查任务冲突
    if (cloudData.todoitems) {
      cloudData.todoitems.forEach(cloudTask => {
        const localChange = localChanges.find(c => 
          c.entityType === 'todoitem' && 
          c.entityId === cloudTask._id &&
          c.type === CHANGE_TYPES.UPDATE
        )
        
        if (localChange) {
          const localTime = new Date(localChange.data.updated_at)
          const cloudTime = new Date(cloudTask.updated_at)
          
          if (Math.abs(cloudTime - localTime) < 1000) {
            conflicts.push({
              type: 'todoitem',
              id: cloudTask._id,
              local: localChange.data,
              cloud: cloudTask
            })
          }
        }
      })
    }
    
    return conflicts
  }

  // 合并云端数据
  async mergeCloudData(cloudData) {
    try {
      // 合并项目册
      if (cloudData.todobooks) {
        const localBooks = uni.getStorageSync('todobooks') || []
        const mergedBooks = this.mergeDataArray(localBooks, cloudData.todobooks, '_id', 'updated_at')
        uni.setStorageSync('todobooks', mergedBooks)
      }
      
      // 合并任务
      if (cloudData.todoitems) {
        const localTasks = uni.getStorageSync('todoitems') || []
        const mergedTasks = this.mergeDataArray(localTasks, cloudData.todoitems, '_id', 'updated_at')
        uni.setStorageSync('todoitems', mergedTasks)
      }
      
    } catch (error) {
      console.error('合并云端数据失败:', error)
      throw error
    }
  }

  // 合并数据数组
  mergeDataArray(localArray, cloudArray, idField, timeField) {
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

  // 清除已同步的变更
  clearSyncedChanges(changes) {
    changes.forEach(change => {
      const key = `${change.entityType}:${change.entityId}`
      this.pendingChanges.delete(key)
    })
  }

  // 生成变更ID
  generateChangeId() {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取同步状态
  getSyncStatus() {
    return {
      isOnline: syncState.isOnline,
      isSyncing: syncState.isSyncing,
      pendingChanges: this.pendingChanges.size,
      queuedChanges: syncState.syncQueue.length,
      lastSyncTime: syncState.lastSyncTime,
      conflicts: syncState.conflictItems.length
    }
  }
}

// 冲突解决器
class ConflictResolver {
  // 解决冲突
  async resolve(conflicts) {
    const resolvedData = {
      todobooks: [],
      todoitems: []
    }
    
    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict)
      
      if (conflict.type === 'todobook') {
        resolvedData.todobooks.push(resolution)
      } else if (conflict.type === 'todoitem') {
        resolvedData.todoitems.push(resolution)
      }
    }
    
    return resolvedData
  }

  // 解决单个冲突
  async resolveConflict(conflict) {
    // 默认策略：使用云端数据（服务器优先）
    // 实际应用中可以提供用户选择界面
    
    switch (this.getConflictResolutionStrategy()) {
      case 'server_wins':
        return conflict.cloud
        
      case 'client_wins':
        return conflict.local
        
      case 'merge':
        return this.mergeConflictData(conflict.local, conflict.cloud)
        
      default:
        return conflict.cloud
    }
  }

  // 获取冲突解决策略
  getConflictResolutionStrategy() {
    const settings = uni.getStorageSync('appSettings') || {}
    return settings.conflictResolution || 'server_wins'
  }

  // 合并冲突数据
  mergeConflictData(local, cloud) {
    // 简单的字段级合并策略
    const merged = { ...cloud }
    
    // 保留本地的某些字段（如用户偏好设置）
    const localOnlyFields = ['color', 'icon', 'sort_order']
    localOnlyFields.forEach(field => {
      if (local[field] !== undefined) {
        merged[field] = local[field]
      }
    })
    
    return merged
  }
}

// 导出同步管理器实例
export const syncManager = new SyncManager()

// 导出同步相关常量和工具
export {
  SYNC_STRATEGIES,
  CHANGE_TYPES,
  syncState
}