import { ref, computed } from 'vue'

/**
 * 统一的标签管理服务
 * 提供标签提取、缓存和管理功能
 */

// 全局标签缓存
const tagCache = new Map()
const taskDataCache = new Map()

/**
 * 从任务数据中提取所有标签
 * @param {Array} tasks - 任务列表
 * @param {boolean} includeColor - 是否包含颜色信息
 * @returns {Array} 提取出的标签列表
 */
export function extractTagsFromTasks(tasks, includeColor = true) {
  const allTags = new Set()
  
  if (!Array.isArray(tasks)) {
    return []
  }
  
  const processTag = (tag) => {
    if (typeof tag === 'object' && tag !== null) {
      // 对象格式标签，支持多种字段名
      const tagId = tag.id || tag.name || tag._id
      const tagName = tag.name || tag.label || tag.title || tag.id || tag._id
      const tagColor = includeColor ? (tag.color || '#007AFF') : undefined
      
      if (tagId && tagName) {
        const tagData = { id: tagId, name: tagName }
        if (includeColor) {
          tagData.color = tagColor
          tagData.createdAt = tag.createdAt || new Date().toISOString()
        }
        allTags.add(JSON.stringify(tagData))
      }
    } else if (typeof tag === 'string' && tag.trim()) {
      const tagData = { id: tag, name: tag }
      if (includeColor) {
        tagData.color = '#007AFF'
        tagData.createdAt = new Date().toISOString()
      }
      allTags.add(JSON.stringify(tagData))
    }
  }
  
  tasks.forEach(task => {
    // 从主任务提取标签
    if (task.tags && Array.isArray(task.tags)) {
      task.tags.forEach(processTag)
    }
    
    // 从子任务提取标签
    if (task.subtasks && Array.isArray(task.subtasks)) {
      task.subtasks.forEach(subtask => {
        if (subtask.tags && Array.isArray(subtask.tags)) {
          subtask.tags.forEach(processTag)
        }
      })
    }
  })
  
  // 转换为数组并按名称排序
  const uniqueTags = Array.from(allTags).map(tagStr => JSON.parse(tagStr))
  return uniqueTags.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

/**
 * 标签管理服务
 */
export function useTagService() {
  
  /**
   * 获取TodoBook的所有标签（带缓存）
   * @param {string} bookId - TodoBook ID
   * @param {Array} tasks - 可选的任务数据，如果提供则直接使用，否则从云端加载
   * @param {boolean} forceRefresh - 是否强制刷新缓存
   * @returns {Promise<Array>} 标签列表
   */
  const getBookTags = async (bookId, tasks = null, forceRefresh = false) => {
    if (!bookId) {
      console.warn('getBookTags: bookId is required')
      return []
    }
    
    const cacheKey = `book_tags_${bookId}`
    
    // 如果有缓存且不强制刷新，直接返回缓存
    if (!forceRefresh && tagCache.has(cacheKey)) {
      console.log('从缓存返回标签:', cacheKey)
      return tagCache.get(cacheKey)
    }
    
    try {
      let taskData = tasks
      
      // 如果没有提供任务数据，从云端加载
      if (!taskData) {
        console.log('从云端加载任务数据以提取标签...')
        const todoBookCo = uniCloud.importObject('todobook-co')
        const result = await todoBookCo.getTodoBookDetail(bookId, {
          includeBasic: false,
          includeMembers: false,
          includeTasks: true
        })
        
        if (result.code === 0 && result.data.tasks) {
          taskData = result.data.tasks
        } else {
          console.error('加载任务数据失败:', result.message)
          return []
        }
      }
      
      // 提取标签
      const extractedTags = extractTagsFromTasks(taskData, true)
      
      // 缓存结果
      tagCache.set(cacheKey, extractedTags)
      console.log('缓存标签数据:', cacheKey, extractedTags.length, '个标签')
      
      return extractedTags
    } catch (error) {
      console.error('获取标签失败:', error)
      return []
    }
  }
  
  /**
   * 获取筛选用的简化标签列表（不包含颜色等额外信息）
   * @param {string} bookId - TodoBook ID
   * @param {Array} tasks - 可选的任务数据
   * @param {boolean} forceRefresh - 是否强制刷新缓存
   * @returns {Promise<Array>} 简化的标签列表
   */
  const getBookTagsForFilter = async (bookId, tasks = null, forceRefresh = false) => {
    if (!bookId) {
      return []
    }
    
    const filterCacheKey = `book_filter_tags_${bookId}`
    
    // 检查缓存
    if (!forceRefresh && tagCache.has(filterCacheKey)) {
      console.log('从缓存返回筛选标签:', filterCacheKey)
      return tagCache.get(filterCacheKey)
    }
    
    try {
      let taskData = tasks
      
      // 如果没有提供任务数据，先检查是否有任务数据缓存
      if (!taskData) {
        const taskCacheKey = `book_tasks_${bookId}`
        if (taskDataCache.has(taskCacheKey)) {
          taskData = taskDataCache.get(taskCacheKey)
          console.log('从任务数据缓存获取数据')
        } else {
          console.log('从云端加载任务数据以提取筛选标签...')
          const todoBookCo = uniCloud.importObject('todobook-co')
          const result = await todoBookCo.getTodoBookDetail(bookId, {
            includeBasic: false,
            includeMembers: false,
            includeTasks: true
          })
          
          if (result.code === 0 && result.data.tasks) {
            taskData = result.data.tasks
            // 缓存任务数据
            taskDataCache.set(taskCacheKey, taskData)
          } else {
            console.error('加载任务数据失败:', result.message)
            return []
          }
        }
      }
      
      // 提取简化标签（不包含颜色信息）
      const extractedTags = extractTagsFromTasks(taskData, false)
      
      // 缓存结果
      tagCache.set(filterCacheKey, extractedTags)
      console.log('缓存筛选标签数据:', filterCacheKey, extractedTags.length, '个标签')
      
      return extractedTags
    } catch (error) {
      console.error('获取筛选标签失败:', error)
      return []
    }
  }
  
  /**
   * 缓存任务数据（当其他地方已经加载了任务数据时调用）
   * @param {string} bookId - TodoBook ID
   * @param {Array} tasks - 任务数据
   */
  const cacheTaskData = (bookId, tasks) => {
    if (bookId && Array.isArray(tasks)) {
      const taskCacheKey = `book_tasks_${bookId}`
      taskDataCache.set(taskCacheKey, tasks)
      console.log('缓存任务数据:', taskCacheKey, tasks.length, '个任务')
    }
  }
  
  /**
   * 清除指定BookId的缓存
   * @param {string} bookId - TodoBook ID
   */
  const clearBookCache = (bookId) => {
    if (bookId) {
      const cacheKey = `book_tags_${bookId}`
      const filterCacheKey = `book_filter_tags_${bookId}`
      const taskCacheKey = `book_tasks_${bookId}`
      
      tagCache.delete(cacheKey)
      tagCache.delete(filterCacheKey)
      taskDataCache.delete(taskCacheKey)
      console.log('清除标签缓存:', bookId)
    }
  }
  
  /**
   * 清除所有缓存
   */
  const clearAllCache = () => {
    tagCache.clear()
    taskDataCache.clear()
    console.log('清除所有标签缓存')
  }
  
  /**
   * 获取缓存状态信息
   */
  const getCacheInfo = () => {
    return {
      tagCacheSize: tagCache.size,
      taskCacheSize: taskDataCache.size,
      tagCacheKeys: Array.from(tagCache.keys()),
      taskCacheKeys: Array.from(taskDataCache.keys())
    }
  }
  
  return {
    // 核心方法
    getBookTags,
    getBookTagsForFilter,
    cacheTaskData,
    
    // 缓存管理
    clearBookCache,
    clearAllCache,
    getCacheInfo,
    
    // 工具方法
    extractTagsFromTasks
  }
}

// 导出单例实例，确保全局缓存一致性
export const tagService = useTagService()