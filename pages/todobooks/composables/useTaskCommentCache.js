import { ref, reactive } from 'vue'
import { API_CODES } from '@/pages/todobooks/utils/constants.js'
import { calculateUnreadCount } from '@/utils/commentUtils.js'
import { getGlobalPerformanceMonitor } from '@/pages/todobooks/utils/performanceMonitor.js'

/**
 * 任务评论缓存管理组合式函数
 * 实现LRU缓存策略，支持按需加载和CRUD操作同步
 * 
 * @param {Object} options 配置选项
 * @param {number} options.maxCacheSize 最大缓存数量，默认100
 * @returns {Object} 缓存管理方法和状态
 */
export function useTaskCommentCache(options = {}) {
  const { maxCacheSize = 100 } = options
  
  // 缓存存储 - 使用Map实现LRU
  const cache = new Map()
  
  // 正在加载的任务ID集合，避免重复请求
  const loadingTasks = ref(new Set())
  
  // 缓存统计信息
  const stats = reactive({
    hits: 0,      // 缓存命中次数
    misses: 0,    // 缓存未命中次数
    size: 0       // 当前缓存大小
  })
  
  // 防抖Map，避免短时间内重复请求
  const debounceMap = new Map()
  
  // 性能监控实例
  const performanceMonitor = getGlobalPerformanceMonitor()
  
  /**
   * LRU缓存管理 - 将访问过的项移到最前面
   * @param {string} taskId 任务ID
   */
  const updateLRU = (taskId) => {
    if (cache.has(taskId)) {
      const value = cache.get(taskId)
      cache.delete(taskId)
      cache.set(taskId, value)
    }
  }
  
  /**
   * 清理最旧的缓存项
   */
  const evictOldest = () => {
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
      stats.size = cache.size
    }
  }
  
  /**
   * 检查是否有缓存数据
   * @param {string} taskId 任务ID
   * @returns {boolean} 是否存在缓存
   */
  const hasCached = (taskId) => {
    if (!taskId) return false
    return cache.has(taskId)
  }
  
  /**
   * 获取缓存的评论数据
   * @param {string} taskId 任务ID
   * @param {boolean} silent 是否静默获取（不触发统计和监控）
   * @returns {Object|null} 缓存的评论数据
   */
  const getCachedComments = (taskId, silent = false) => {
    if (!taskId || !cache.has(taskId)) {
      return null
    }
    
    updateLRU(taskId)
    
    if (!silent) {
      stats.hits++
      
      // 记录缓存命中（仅在非静默模式）
      performanceMonitor.recordCommentRequest('cache')
      performanceMonitor.updateCacheHitRate(getCacheStats())
    }
    
    return cache.get(taskId)
  }
  
  /**
   * 从云函数获取任务评论数据
   * @param {string} taskId 任务ID
   * @param {boolean} useDebounce 是否使用防抖，默认false（依赖loadingTasks机制）
   * @returns {Promise<Object|null>} 评论数据
   */
  const getTaskComments = async (taskId, useDebounce = false) => {
    if (!taskId) {
      console.warn('getTaskComments: taskId is required')
      return null
    }
    
    // 检查是否正在加载
    if (loadingTasks.value.has(taskId)) {
      console.log(`⏳ getTaskComments: 任务 ${taskId} 正在加载中，跳过重复请求`)
      return null
    }
    
    // 防抖处理
    if (useDebounce) {
      const now = Date.now()
      const lastRequest = debounceMap.get(taskId)
      if (lastRequest && now - lastRequest < 1000) {
        console.log(`🚫 getTaskComments: 任务 ${taskId} 被防抖拦截 (${now - lastRequest}ms)`)
        return null
      }
      debounceMap.set(taskId, now)
    }
    
    // 先检查缓存
    const cachedData = getCachedComments(taskId, true) // 静默获取，避免重复统计
    if (cachedData) {
      console.log(`✅ getTaskComments: 任务 ${taskId} 使用缓存数据`)
      return cachedData
    }
    
    stats.misses++
    loadingTasks.value.add(taskId)
    
    // 记录网络请求
    performanceMonitor.recordCommentRequest('network')
    
    try {
      console.log(`🌐 [网络请求 #${stats.misses}] 开始加载任务 ${taskId} 的评论数据`)
    
    // 调试：记录调用栈前几层，帮助定位重复请求来源
    if (stats.misses > 55) {
      console.warn(`⚠️ 网络请求数 (${stats.misses}) 超过预期，调用栈:`, new Error().stack?.split('\n').slice(1, 4))
    }
      
      const todoBooksObj = uniCloud.importObject('todobook-co')
      const result = await todoBooksObj.getTaskComments(taskId, 1, 50)
      
      if (result.code === API_CODES.SUCCESS) {
        const commentData = {
          comments: result.data.comments || [],
          total: result.data.total || 0,
          lastUpdated: Date.now(),
          isComplete: result.data.comments.length >= result.data.total // 是否已加载完整数据
        }
        
        // 存入缓存前先清理空间
        evictOldest()
        cache.set(taskId, commentData)
        stats.size = cache.size
        
        console.log(`任务 ${taskId} 评论数据加载成功，共 ${commentData.total} 条评论`)
        return commentData
      } else {
        console.error(`加载任务 ${taskId} 评论失败:`, result.message)
        return null
      }
    } catch (error) {
      console.error(`加载任务 ${taskId} 评论异常:`, error)
      return null
    } finally {
      loadingTasks.value.delete(taskId)
      
      // 清理防抖记录
      setTimeout(() => {
        debounceMap.delete(taskId)
      }, 2000)
    }
  }
  
  /**
   * 添加评论到缓存
   * @param {string} taskId 任务ID
   * @param {Object} comment 新评论对象
   */
  const addComment = (taskId, comment) => {
    if (!taskId || !comment) return
    
    const cachedData = getCachedComments(taskId)
    if (cachedData) {
      // 将新评论添加到列表开头（最新评论在前）
      cachedData.comments.unshift(comment)
      cachedData.total = cachedData.total + 1
      cachedData.lastUpdated = Date.now()
      
      // 更新缓存
      cache.set(taskId, cachedData)
      console.log(`缓存中添加评论成功，任务 ${taskId}`)
    }
  }
  
  /**
   * 更新缓存中的评论
   * @param {string} taskId 任务ID
   * @param {string} commentId 评论ID
   * @param {Object} updateData 更新的数据
   */
  const updateComment = (taskId, commentId, updateData) => {
    if (!taskId || !commentId || !updateData) return
    
    const cachedData = getCachedComments(taskId)
    if (cachedData) {
      // 查找并更新评论
      const commentIndex = cachedData.comments.findIndex(c => c._id === commentId)
      if (commentIndex !== -1) {
        Object.assign(cachedData.comments[commentIndex], updateData)
        cachedData.lastUpdated = Date.now()
        
        // 更新缓存
        cache.set(taskId, cachedData)
        console.log(`缓存中更新评论成功，任务 ${taskId}，评论 ${commentId}`)
      }
    }
  }
  
  /**
   * 从缓存中删除评论
   * @param {string} taskId 任务ID
   * @param {string} commentId 评论ID
   */
  const deleteComment = (taskId, commentId) => {
    if (!taskId || !commentId) return
    
    const cachedData = getCachedComments(taskId)
    if (cachedData) {
      // 过滤掉被删除的评论
      const originalLength = cachedData.comments.length
      cachedData.comments = cachedData.comments.filter(c => c._id !== commentId)
      
      if (cachedData.comments.length < originalLength) {
        cachedData.total = Math.max(0, cachedData.total - 1)
        cachedData.lastUpdated = Date.now()
        
        // 更新缓存
        cache.set(taskId, cachedData)
        console.log(`缓存中删除评论成功，任务 ${taskId}，评论 ${commentId}`)
      }
    }
  }
  
  /**
   * 清理指定任务的缓存
   * @param {string} taskId 任务ID
   */
  const clearTaskCache = (taskId) => {
    if (!taskId) return
    
    if (cache.has(taskId)) {
      cache.delete(taskId)
      stats.size = cache.size
      console.log(`清理任务 ${taskId} 的缓存`)
    }
  }
  
  /**
   * 清理所有缓存
   */
  const clearCache = () => {
    cache.clear()
    stats.size = 0
    stats.hits = 0
    stats.misses = 0
    console.log('清理所有评论缓存')
  }
  
  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  const getCacheStats = () => {
    return {
      size: stats.size,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits + stats.misses > 0 ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) + '%' : '0%',
      maxSize: maxCacheSize
    }
  }
  
  /**
   * 批量预加载评论数据（用于兼容原有批量加载逻辑）
   * @param {Array} taskIds 任务ID数组
   * @returns {Promise<void>}
   */
  const preloadComments = async (taskIds) => {
    if (!Array.isArray(taskIds) || taskIds.length === 0) return
    
    console.log(`开始预加载 ${taskIds.length} 个任务的评论数据`)
    
    // 并发控制，最多5个并发请求
    const concurrency = 5
    const chunks = []
    for (let i = 0; i < taskIds.length; i += concurrency) {
      chunks.push(taskIds.slice(i, i + concurrency))
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(taskId => getTaskComments(taskId, false))
      await Promise.all(promises)
    }
    
    console.log(`预加载完成，当前缓存大小: ${stats.size}`)
  }
  
  /**
   * 将缓存数据同步到task对象
   * 确保task.comments字段与缓存数据保持一致
   * @param {string} taskId 任务ID
   * @param {Array} allTasks 所有任务数组的引用
   * @returns {boolean} 是否同步成功
   */
  const syncCacheToTask = (taskId, allTasks) => {
    if (!taskId || !Array.isArray(allTasks)) {
      console.warn('syncCacheToTask: 参数无效')
      return false
    }
    
    const cachedData = getCachedComments(taskId)
    if (!cachedData) {
      return false
    }
    
    // 查找对应的task对象
    const task = allTasks.find(t => t._id === taskId)
    if (!task) {
      return false
    }
    
    // 同步缓存数据到task对象
    task.comments = cachedData.comments
    task.comment_count = cachedData.total
    
    console.log(`同步缓存数据到task对象成功，任务 ${taskId}，评论数量 ${cachedData.total}`)
    return true
  }
  
  /**
   * 批量同步缓存数据到多个task对象
   * @param {Array} allTasks 所有任务数组的引用
   * @returns {number} 同步成功的数量
   */
  const batchSyncCacheToTasks = (allTasks) => {
    if (!Array.isArray(allTasks)) {
      console.warn('batchSyncCacheToTasks: allTasks must be an array')
      return 0
    }
    
    let syncCount = 0
    for (const [taskId] of cache) {
      if (syncCacheToTask(taskId, allTasks)) {
        syncCount++
      }
    }
    
    console.log(`批量同步完成，成功同步 ${syncCount} 个任务的缓存数据`)
    return syncCount
  }
  
  /**
   * 智能缓存检查和加载
   * 用于VirtualTaskList中的按需加载逻辑
   * @param {string} taskId 任务ID
   * @param {Array} allTasks 所有任务数组的引用
   * @param {Function} onLoadComplete 加载完成回调
   * @returns {boolean} 是否立即有可用数据
   */
  const smartLoadComments = async (taskId, allTasks, onLoadComplete = null) => {
    if (!taskId) return false
    
    // 检查缓存
    if (hasCached(taskId)) {
      syncCacheToTask(taskId, allTasks)
      return true
    }
    
    // 检查是否正在加载，避免重复请求
    if (loadingTasks.value.has(taskId)) {
      console.log(`smartLoadComments: 任务 ${taskId} 正在加载中，跳过重复请求`)
      return false
    }
    
    // 缓存不存在且未在加载，异步加载（启用防抖）
    try {
      const commentData = await getTaskComments(taskId, true) // 启用防抖
      if (commentData) {
        syncCacheToTask(taskId, allTasks)
        if (typeof onLoadComplete === 'function') {
          onLoadComplete(taskId, commentData)
        }
        return true
      }
    } catch (error) {
      console.error(`smartLoadComments failed for task ${taskId}:`, error)
    }
    
    return false
  }
  
  /**
   * 获取任务的未读评论数量
   * 优先使用缓存数据，回退到task对象数据
   * @param {string} taskId 任务ID
   * @param {Object} task task对象（fallback）
   * @param {string} currentUserId 当前用户ID
   * @param {boolean} silent 是否静默模式（避免触发监控统计）
   * @returns {number} 未读评论数量
   */
  const getTaskUnreadCount = (taskId, task = null, currentUserId = null, silent = true) => {
    if (!taskId || !currentUserId) return 0
    
    // 优先使用缓存数据（静默模式，避免递归）
    const cachedData = getCachedComments(taskId, silent)
    if (cachedData && cachedData.comments) {
      try {
        return calculateUnreadCount(taskId, cachedData.comments, currentUserId)
      } catch (error) {
        console.error('计算未读数量失败:', error)
        return 0
      }
    }
    
    // 回退到task对象数据
    if (task && task.comments) {
      try {
        return calculateUnreadCount(taskId, task.comments, currentUserId)
      } catch (error) {
        console.error('计算未读数量失败:', error)
        return 0
      }
    }
    
    return 0
  }
  
  return {
    // 状态
    loadingTasks,
    
    // 基础方法
    hasCached,
    getCachedComments,
    getTaskComments,
    clearCache,
    clearTaskCache,
    getCacheStats,
    
    // CRUD操作方法
    addComment,
    updateComment,
    deleteComment,
    
    // 数据同步方法
    syncCacheToTask,
    batchSyncCacheToTasks,
    smartLoadComments,
    getTaskUnreadCount,
    
    // 高级功能
    preloadComments
  }
}

/**
 * 全局单例缓存实例
 * 在整个应用中共享评论缓存
 */
let globalCommentCache = null

/**
 * 获取全局评论缓存实例
 * @returns {Object} 缓存实例
 */
export function getGlobalCommentCache() {
  if (!globalCommentCache) {
    globalCommentCache = useTaskCommentCache({
      maxCacheSize: 100
    })
  }
  return globalCommentCache
}