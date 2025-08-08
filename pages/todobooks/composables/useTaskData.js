import { ref, computed } from 'vue'
import { tagService } from '@/pages/tasks/composables/useTagService.js'
import { organizeParentChildTasks, calculateTaskStats, filterTasks, validateTaskCompletion } from '@/pages/todobooks/utils/taskUtils.js'
import { calculateUnreadCount } from '@/utils/commentUtils.js'
import { API_CODES, ERROR_MESSAGES, TASK_CONSTANTS } from '@/pages/todobooks/utils/constants.js'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { getGlobalCommentCache } from '@/pages/todobooks/composables/useTaskCommentCache.js'
import { currentUserId } from '@/store/storage.js'
import { useDataAdapter } from '@/composables/useDataAdapter.js'

/**
 * 按标签筛选任务
 * @param {Array} tasks - 任务数组
 * @param {Array} selectedTags - 选中的标签数组
 * @returns {Array} 筛选结果
 */
function filterTasksByTags(tasks, selectedTags) {
  if (!selectedTags || selectedTags.length === 0) {
    return tasks
  }
  
  return tasks.filter(task => {
    if (!task.tags || !Array.isArray(task.tags)) {
      return false
    }
    
    return selectedTags.some(selectedTag => {
      return task.tags.some(taskTag => {
        const selectedTagId = typeof selectedTag === 'object' ? selectedTag.id : selectedTag
        const selectedTagName = typeof selectedTag === 'object' ? selectedTag.name : selectedTag
        
        if (typeof taskTag === 'object') {
          return taskTag.id === selectedTagId || taskTag.name === selectedTagName
        } else {
          return taskTag === selectedTagId || taskTag === selectedTagName
        }
      })
    })
  })
}

/**
 * 按时间字段排序任务
 * @param {Array} tasks - 任务数组
 * @param {string} field - 排序字段 (created_at, updated_at)
 * @param {string} order - 排序顺序 (asc, desc)
 * @returns {Array} 排序后的任务数组
 */
function sortByTime(tasks, field, order) {
  try {
    if (!tasks || tasks.length === 0) return []
    
    const sortedArray = [...tasks]
    
    sortedArray.sort((a, b) => {
      let aTime = a[field]
      let bTime = b[field]
      
      // 处理updated_at为空的情况，使用created_at
      if (field === 'updated_at') {
        aTime = aTime || a.created_at
        bTime = bTime || b.created_at
      }
      
      // 转换为时间戳进行比较
      const aTimestamp = new Date(aTime).getTime()
      const bTimestamp = new Date(bTime).getTime()
      
      if (order === 'asc') {
        return aTimestamp - bTimestamp
      } else {
        return bTimestamp - aTimestamp
      }
    })
    
    console.log(`按${field}${order === 'asc' ? '升序' : '降序'}排序完成，共${sortedArray.length}个任务`)
    return sortedArray
  } catch (error) {
    console.error('时间排序失败:', error)
    return tasks
  }
}

/**
 * 按Tag分组排序任务
 * @param {Array} tasks - 任务数组
 * @param {string} order - 排序顺序 (asc, desc)
 * @returns {Array} 排序后的任务数组
 */
function sortByTags(tasks, order) {
  try {
    if (!tasks || tasks.length === 0) return []
    
    // 将任务按tag分组
    const tagGroups = new Map()
    const noTagTasks = []
    
    tasks.forEach(task => {
      const firstTag = getFirstTag(task)
      if (firstTag) {
        const tagName = typeof firstTag === 'object' ? firstTag.name : firstTag
        if (!tagGroups.has(tagName)) {
          tagGroups.set(tagName, [])
        }
        tagGroups.get(tagName).push(task)
      } else {
        noTagTasks.push(task)
      }
    })
    
    // 按tag名称排序
    const sortedTagNames = Array.from(tagGroups.keys()).sort((a, b) => {
      return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    })
    
    // 组装最终结果
    const result = []
    sortedTagNames.forEach(tagName => {
      const groupTasks = tagGroups.get(tagName)
      // 组内按创建时间降序排列
      groupTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      result.push(...groupTasks)
    })
    
    // 无tag任务放到最后，也按创建时间降序排列
    noTagTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    result.push(...noTagTasks)
    
    return result
  } catch (error) {
    console.error('Tag排序失败:', error)
    return tasks
  }
}

/**
 * 获取任务的第一个标签
 * @param {Object} task - 任务对象
 * @returns {string|Object|null} 第一个标签
 */
function getFirstTag(task) {
  try {
    if (!task || !task.tags || !Array.isArray(task.tags) || task.tags.length === 0) {
      return null
    }
    return task.tags[0]
  } catch (error) {
    console.error('获取第一个标签失败:', error, task)
    return null
  }
}

/**
 * 应用排序逻辑
 * @param {Array} tasks - 任务数组
 * @param {Object} sortOption - 排序选项
 * @returns {Array} 排序后的任务数组
 */
function applySorting(tasks, sortOption) {
  if (!tasks || tasks.length === 0) return []
  
  const { field, order } = sortOption
  
  switch (field) {
    case 'created_at':
    case 'updated_at':
      return sortByTime(tasks, field, order)
    case 'tags':
      return sortByTags(tasks, order)
    default:
      console.warn('未知的排序字段:', field)
      return tasks
  }
}

/**
 * 搜索任务函数
 * @param {Array} tasks - 任务数组
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 搜索结果
 */
function searchTasks(tasks, keyword) {
  if (!keyword || !keyword.trim()) {
    return tasks
  }
  
  const searchRegex = new RegExp(keyword.trim(), 'i')
  
  return tasks.filter(task => {
    // 搜索任务标题
    if (task.title && searchRegex.test(task.title)) {
      return true
    }
    
    // 搜索任务描述
    if (task.description && searchRegex.test(task.description)) {
      return true
    }
    
    // 搜索任务标签
    if (task.tags && Array.isArray(task.tags)) {
      const hasMatchingTag = task.tags.some(tag => {
        if (typeof tag === 'string') {
          return searchRegex.test(tag)
        } else if (tag && tag.name) {
          return searchRegex.test(tag.name)
        }
        return false
      })
      if (hasMatchingTag) {
        return true
      }
    }
    
    // 搜索子任务
    if (task.subtasks && Array.isArray(task.subtasks)) {
      const hasMatchingSubtask = task.subtasks.some(subtask => {
        if (subtask.title && searchRegex.test(subtask.title)) {
          return true
        }
        if (subtask.description && searchRegex.test(subtask.description)) {
          return true
        }
        if (subtask.tags && Array.isArray(subtask.tags)) {
          return subtask.tags.some(tag => {
            if (typeof tag === 'string') {
              return searchRegex.test(tag)
            } else if (tag && tag.name) {
              return searchRegex.test(tag.name)
            }
            return false
          })
        }
        return false
      })
      if (hasMatchingSubtask) {
        return true
      }
    }
    
    return false
  })
}

/**
 * 任务数据管理组合式函数
 * @param {string} bookId - 项目册ID
 * @param {Object} allTasks - 所有任务数据的响应式引用
 * @returns {Object} 任务数据和操作方法
 */
/**
 * 获取排序存储键
 * @param {string} userId - 用户ID
 * @param {string} bookId - 项目册ID
 * @returns {string|null} 存储键
 */
function getSortStorageKey(userId, bookId) {
  if (!userId || !bookId) return null
  return `task_sort_${userId}_${bookId}`
}

/**
 * 从本地存储加载排序偏好
 * @param {string} bookId - 项目册ID
 * @returns {Object} 排序选项
 */
function loadSortFromStorage(bookId) {
  try {
    const userId = currentUserId.value
    const storageKey = getSortStorageKey(userId, bookId)
    
    if (storageKey) {
      const sortDataStr = uni.getStorageSync(storageKey)
      if (sortDataStr) {
        const sortData = JSON.parse(sortDataStr)
        return sortData.sortOption || { field: 'created_at', order: 'desc' }
      }
    }
  } catch (error) {
    console.error('useTaskData加载排序偏好失败:', error)
  }
  
  return { field: 'created_at', order: 'desc' }
}

export function useTaskData(initialBookId, allTasks = null, bookData = null) {
  // 存储当前的bookId，支持运行时更新
  const currentBookId = ref(initialBookId)
  
  // 初始化数据适配器
  const dataAdapter = useDataAdapter()
  
  // 响应式数据
  const tasks = ref([])
  const loading = ref(false)
  const error = ref(null)
  const activeFilter = ref('all')
  const searchKeyword = ref('')
  const selectedTags = ref([])
  const cachedAvailableTags = ref([])
  // 初始化为默认排序，稍后通过initializeSortFromStorage设置
  const currentSort = ref({ field: 'created_at', order: 'desc' })
  
  // 计算属性
  const filteredTasks = computed(() => {
    let filtered = filterTasks(tasks.value, activeFilter.value)
    
    // 按标签筛选
    if (selectedTags.value.length > 0) {
      filtered = filterTasksByTags(filtered, selectedTags.value)
    }
    
    // 如果有搜索关键词，进一步过滤
    if (searchKeyword.value.trim()) {
      filtered = searchTasks(filtered, searchKeyword.value.trim())
    }
    
    return filtered
  })

  // 排序后的任务列表（先过滤后排序）
  const sortedTasks = computed(() => {
    const filtered = filteredTasks.value
    const sorted = applySorting(filtered, currentSort.value)
    return sorted
  })
  
  const taskStats = computed(() => {
    let total = 0
    let completed = 0
    
    if (!tasks.value) return { total: 0, completed: 0, todo: 0 }
  
    tasks.value.forEach(task => {
      total++
      if (task.status === 'completed') {
        completed++
      }
    })
    
    tasks.value.forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) {
        total += task.subtasks.length
        task.subtasks.forEach(subtask => {
          if (subtask.status === 'completed') {
            completed++
          }
        })
      }
    })
    
    return { total, completed, todo: total - completed }
  })
  
  const filterTabs = computed(() => {
    const stats = taskStats.value
    return [
      { key: 'all', label: '全部', count: stats.total },
      { key: 'todo', label: '待办', count: stats.todo },
      { key: 'completed', label: '已完成', count: stats.completed }
    ]
  })
  
  // 获取所有可用标签（优先使用缓存，回退到实时计算）
  const availableTags = computed(() => {
    // 如果有缓存的标签数据，优先使用
    if (cachedAvailableTags.value.length > 0) {
      return cachedAvailableTags.value
    }
    
    // 回退到原来的实时计算逻辑
    const sourceData = allTasks?.value || tasks.value
    if (!Array.isArray(sourceData)) {
      return []
    }
    
    // 使用标签服务的提取逻辑，但不包含颜色信息（用于筛选）
    const extractedTags = tagService.extractTagsFromTasks(sourceData, false)
    return extractedTags
  })
  
  /**
   * 异步加载并缓存标签数据
   * @param {boolean} forceRefresh - 是否强制刷新
   */
  const loadAvailableTags = async (forceRefresh = false) => {
    if (!currentBookId.value) {
      console.warn('loadAvailableTags: bookId is required')
      return
    }
    
    try {
      // 优先使用已有的任务数据
      const sourceData = allTasks?.value || tasks.value
      if (Array.isArray(sourceData) && sourceData.length > 0) {
        // 先缓存任务数据到标签服务
        tagService.cacheTaskData(currentBookId.value, sourceData)
      }
      
      // 使用标签服务获取标签（支持缓存）
      const tags = await tagService.getBookTagsForFilter(currentBookId.value, sourceData, forceRefresh)
      cachedAvailableTags.value = tags
    } catch (error) {
      console.error('加载可用标签失败:', error)
    }
  }
  
  /**
   * 初始化任务数据
   * @param {Array} tasksData - 任务数据数组
   */
  const initializeTasks = async (tasksData) => {
    if (loading.value) {
      console.log('initializeTasks 跳过: 正在加载中')
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      // 如果提供了任务数据，直接使用
      if (tasksData && Array.isArray(tasksData)) {
        console.log('initializeTasks 使用提供的任务数据')
        tasks.value = tasksData
      } else {
        error.value = '任务数据不能为空'
        return
      }
      
      // 调试信息：分析接收到的任务数据
      const receivedParentTasks = tasks.value.filter(task => !task.parent_id)
      const receivedChildTasks = tasks.value.filter(task => task.parent_id)
      
      if (receivedChildTasks.length > 0) {
        receivedChildTasks.forEach(child => {
          console.log(`  - 子任务 ${child._id} (${child.title}) -> 父任务 ${child.parent_id}`)
        })
      }
      
      // 处理任务数据，确保格式正确
      const processedTasks = tasks.value.map(task => ({
        ...task,
        tags: Array.isArray(task.tags) ? task.tags : [],
        expanded: false, // 默认收起状态
        subtasks: []
      }))
      
      // 组织父子关系：只显示父任务，子任务作为父任务的属性
      tasks.value = organizeParentChildTasks(processedTasks)
      
      // 调试信息：验证组织后的结果
      let totalSubtasksCount = 0
      tasks.value.forEach(parentTask => {
        if (parentTask.subtasks && parentTask.subtasks.length > 0) {
          totalSubtasksCount += parentTask.subtasks.length
        }
      })
      
      // 跳过批量加载评论数据，改为按需加载
      // 原有批量加载逻辑保留作为降级方案
      // await loadTasksCommentCounts(processedTasks)
      
      // 异步加载并缓存标签数据
      if (currentBookId.value) {
        loadAvailableTags()
      }
      
    } catch (err) {
      console.error('加载任务列表失败:', err)
      error.value = ERROR_MESSAGES.NETWORK_ERROR
      uni.showToast({
        title: error.value,
        icon: 'none'
      })
    } finally {
      loading.value = false
    }
  }
  
  
  /**
   * 切换任务状态
   * @param {Object} task - 任务对象
   */
  const toggleTaskStatus = async (task) => {
    // 检查归档状态权限
    if (bookData?.value?.is_archived) {
      uni.showToast({
        title: '归档项目册中的任务不能修改状态',
        icon: 'none'
      })
      return
    }
    
    // 验证任务是否可以完成
    const validation = validateTaskCompletion(task)
    if (!validation.canComplete) {
      uni.showToast({
        title: validation.message,
        icon: 'none'
      })
      return
    }
    
    const oldStatus = task.status
    const newStatus = task.status === TASK_CONSTANTS.STATUS.COMPLETED 
      ? TASK_CONSTANTS.STATUS.TODO 
      : TASK_CONSTANTS.STATUS.COMPLETED
    
    // 先乐观更新UI
    task.status = newStatus
    task.updated_at = new Date()
    task.last_activity_at = new Date()
    
    if (newStatus === TASK_CONSTANTS.STATUS.COMPLETED) {
      task.completed_at = new Date()
    } else {
      task.completed_at = null
    }
    
    try {
      const result = await dataAdapter.updateTask(task._id, { status: newStatus })
      
      if (result) {
        // 处理父子任务关系的本地更新
        await handleLocalParentChildUpdate(task, newStatus)
      } else {
        // 如果失败，回滚本地更新
        task.status = oldStatus
        task.updated_at = new Date()
        task.last_activity_at = new Date()
        
        if (oldStatus === TASK_CONSTANTS.STATUS.COMPLETED) {
          task.completed_at = new Date()
        } else {
          task.completed_at = null
        }
        
        throw new Error(ERROR_MESSAGES.OPERATION_FAILED)
      }
    } catch (err) {
      console.error('更新任务状态失败:', err)
      uni.showToast({
        title: err.message || ERROR_MESSAGES.OPERATION_FAILED,
        icon: 'error'
      })
    }
  }
  
  /**
   * 处理父子任务关系的本地更新
   * @param {Object} task - 任务对象
   * @param {string} newStatus - 新状态
   */
  const handleLocalParentChildUpdate = async (task, newStatus) => {
    // 如果是子任务，更新父任务的完成子任务计数和状态
    if (task.parent_id) {
      // 查找父任务
      let parentTask = null
      for (let i = 0; i < tasks.value.length; i++) {
        if (tasks.value[i]._id === task.parent_id) {
          parentTask = tasks.value[i]
          break
        }
      }
      
      if (parentTask) {
        // 更新父任务的完成子任务计数
        if (newStatus === TASK_CONSTANTS.STATUS.COMPLETED) {
          parentTask.completed_subtask_count = (parentTask.completed_subtask_count || 0) + 1
        } else {
          parentTask.completed_subtask_count = Math.max(0, (parentTask.completed_subtask_count || 0) - 1)
        }
        
        // 如果所有子任务都完成了，自动完成父任务
        if (parentTask.completed_subtask_count === parentTask.subtask_count && 
            parentTask.status !== TASK_CONSTANTS.STATUS.COMPLETED) {
          parentTask.status = TASK_CONSTANTS.STATUS.COMPLETED
          parentTask.completed_at = new Date()
          parentTask.updated_at = new Date()
          parentTask.last_activity_at = new Date()
          
          // 使用数据适配器更新父任务状态
          try {
            await dataAdapter.updateTask(parentTask._id, { status: TASK_CONSTANTS.STATUS.COMPLETED })
          } catch (err) {
            console.error('更新父任务状态失败:', err)
          }
        }
        // 如果父任务已完成但有子任务变为未完成，父任务回退
        else if (parentTask.completed_subtask_count < parentTask.subtask_count && 
                 parentTask.status === TASK_CONSTANTS.STATUS.COMPLETED) {
          parentTask.status = TASK_CONSTANTS.STATUS.TODO
          parentTask.completed_at = null
          parentTask.updated_at = new Date()
          parentTask.last_activity_at = new Date()
          
          // 使用数据适配器更新父任务状态
          try {
            await dataAdapter.updateTask(parentTask._id, { status: TASK_CONSTANTS.STATUS.TODO })
          } catch (err) {
            console.error('更新父任务状态失败:', err)
          }
        }
      }
    }
    
    // 如果是父任务且有子任务，更新子任务计数
    if (task.subtask_count > 0 && task.subtasks) {
      let completedCount = 0
      task.subtasks.forEach(subtask => {
        if (subtask.status === TASK_CONSTANTS.STATUS.COMPLETED) {
          completedCount++
        }
      })
      task.completed_subtask_count = completedCount
    }
  }
  
  /**
   * 删除任务
   * @param {string} taskId - 任务ID
   */
  const deleteTask = async (taskId) => {
    try {
      const result = await dataAdapter.deleteTask(taskId)
      return result
    } catch (err) {
      console.error('删除任务失败:', err)
      throw err
    }
  }

  /**
   * 切换子任务状态
   * @param {Object} subtask - 子任务对象
   */
  const toggleSubtaskStatus = async (subtask) => {
    // 检查归档状态权限
    if (bookData?.value?.is_archived) {
      uni.showToast({
        title: '归档项目册中的任务不能修改状态',
        icon: 'none'
      })
      return
    }
    
    // 验证子任务是否可以完成
    const validation = validateTaskCompletion(subtask)
    if (!validation.canComplete) {
      uni.showToast({
        title: validation.message,
        icon: 'none'
      })
      return
    }
    
    const oldStatus = subtask.status
    const newStatus = subtask.status === TASK_CONSTANTS.STATUS.COMPLETED 
      ? TASK_CONSTANTS.STATUS.TODO 
      : TASK_CONSTANTS.STATUS.COMPLETED
    
    // 先乐观更新UI
    subtask.status = newStatus
    subtask.updated_at = new Date()
    subtask.last_activity_at = new Date()
    
    if (newStatus === TASK_CONSTANTS.STATUS.COMPLETED) {
      subtask.completed_at = new Date()
    } else {
      subtask.completed_at = null
    }
    
    try {
      // 使用数据适配器更新任务状态
      const result = await dataAdapter.updateTask(subtask._id, { status: newStatus })
      
      if (result) {
        // 处理父子任务关系的本地更新
        await handleLocalParentChildUpdate(subtask, newStatus)
      } else {
        // 如果失败，回滚本地更新
        subtask.status = oldStatus
        subtask.updated_at = new Date()
        subtask.last_activity_at = new Date()
        
        if (oldStatus === TASK_CONSTANTS.STATUS.COMPLETED) {
          subtask.completed_at = new Date()
        } else {
          subtask.completed_at = null
        }
        
        throw new Error(result.message || ERROR_MESSAGES.OPERATION_FAILED)
      }
    } catch (err) {
      console.error('更新子任务状态失败:', err)
      uni.showToast({
        title: err.message || ERROR_MESSAGES.OPERATION_FAILED,
        icon: 'error'
      })
    }
  }
  
  /**
   * 设置筛选器
   * @param {string} filter - 筛选条件
   */
  const setActiveFilter = (filter) => {
    activeFilter.value = filter
  }
  
  /**
   * 设置搜索关键词
   * @param {string} keyword - 搜索关键词
   */
  const setSearchKeyword = (keyword) => {
    searchKeyword.value = keyword
  }
  
  /**
   * 设置选中的标签
   * @param {Array} tags - 选中的标签数组
   */
  const setSelectedTags = (tags) => {
    selectedTags.value = tags || []
  }

  /**
   * 保存排序选项到本地存储
   * @param {Object} sortOption - 排序选项
   */
  const saveSortToStorage = (sortOption) => {
    try {
      const userId = currentUserId.value
      const storageKey = getSortStorageKey(userId, currentBookId.value)
      
      if (storageKey) {
        const sortData = {
          sortOption: sortOption,
          timestamp: Date.now()
        }
        uni.setStorageSync(storageKey, JSON.stringify(sortData))
      } else {
        console.log('❌ useTaskData保存失败 - 无法生成存储键')
      }
    } catch (error) {
      console.error('❌ useTaskData保存排序偏好失败:', error)
    }
  }

  /**
   * 设置排序选项并保存到本地存储
   * @param {Object} sortOption - 排序选项 { field, order }
   */
  const setSortOption = (sortOption) => {
    if (sortOption && sortOption.field && sortOption.order) {
      // 只保留排序相关的字段，移除UI相关字段
      const cleanSortOption = {
        field: sortOption.field,
        order: sortOption.order
      }
      currentSort.value = { ...cleanSortOption }
      // 保存到本地存储
      saveSortToStorage(cleanSortOption)
    } else {
      console.log('❌ useTaskData排序选项验证失败 - 数据格式错误:', JSON.stringify(sortOption, null, 2))
    }
  }

  /**
   * 重置状态
   */
  /**
   * 清理评论缓存
   */
  const clearCommentCache = () => {
    const commentCache = getGlobalCommentCache()
    commentCache.clearCache()
    console.log('useTaskData: 已清理所有评论缓存')
  }
  
  /**
   * 获取任务的未读评论数量（兼容原有逻辑）
   * @param {string} taskId 任务ID
   * @returns {number} 未读评论数量
   */
  const getTaskUnreadCount = (taskId) => {
    if (!taskId) return 0
    
    const commentCache = getGlobalCommentCache()
    const currentUserId = store.state?.userInfo?._id
    
    if (!currentUserId) return 0
    
    // 查找task对象
    const task = tasks.value.find(t => t._id === taskId)
    return commentCache.getTaskUnreadCount(taskId, task, currentUserId)
  }
  
  /**
   * 批量加载评论数据（降级方案）
   * @param {Array} allTasks 所有任务数组
   */
  const loadTasksCommentCounts = async (allTasks) => {
    console.log('使用降级方案：批量加载评论数据')
    
    try {
      const todoBooksObj = uniCloud.importObject('todobook-co')
      
      // 并行获取每个任务的评论数据
      const commentPromises = allTasks.map(async task => {
        try {
          const result = await todoBooksObj.getTaskComments(task._id, 1, 50)
          
          if (result.code === API_CODES.SUCCESS) {
            return {
              taskId: task._id,
              comments: result.data.comments,
              total: result.data.total
            }
          }
        } catch (error) {
          console.error(`获取任务${task._id}评论数据失败:`, error)
        }
        
        return {
          taskId: task._id,
          comments: [],
          total: 0
        }
      })
      
      const commentData = await Promise.all(commentPromises)
      
      // 将评论数据添加到任务对象中
      commentData.forEach(({ taskId, comments, total }) => {
        const task = allTasks.find(t => t._id === taskId)
        if (task) {
          task.comments = comments
          task.comment_count = total
        }
      })
      
      // 确保子任务也能获取到评论数据
      tasks.value.forEach(parentTask => {
        if (parentTask.subtasks && parentTask.subtasks.length > 0) {
          parentTask.subtasks.forEach(subtask => {
            const allTaskData = allTasks.find(t => t._id === subtask._id)
            if (allTaskData && allTaskData.comments) {
              subtask.comments = allTaskData.comments
              subtask.comment_count = allTaskData.comment_count || 0
            }
          })
        }
      })
      
    } catch (error) {
      console.error('批量加载评论数据失败:', error)
    }
  }

  const resetState = () => {
    tasks.value = []
    loading.value = false
    error.value = null
    activeFilter.value = 'all'
    searchKeyword.value = ''
    selectedTags.value = []
    cachedAvailableTags.value = []
    currentSort.value = { field: 'created_at', order: 'desc' }
    
    // 清除标签服务中的缓存
    if (currentBookId.value) {
      tagService.clearBookCache(currentBookId.value)
    }
    
    // 清除评论缓存
    clearCommentCache()
  }

  const overallProgress = computed(() => {
    const stats = taskStats.value
    if (stats.total === 0) return 0
    return Math.round((stats.completed / stats.total) * 100)
  })
  
  /**
   * 乐观更新任务
   * @param {Object} updatedTask - 更新后的任务对象
   */
  const updateTaskOptimistic = async (updatedTask) => {
    const taskIndex = tasks.value.findIndex(t => t._id === updatedTask._id)
    
    if (taskIndex === -1) {
      // 子任务可能不在当前页面的tasks列表中，但仍需要更新数据库
      try {
        await dataAdapter.updateTask(updatedTask._id, updatedTask)
        uni.showToast({ title: '保存成功', icon: 'success' })
      } catch (error) {
        console.error('任务更新失败:', error)
        uni.showToast({ title: error.message || '保存失败', icon: 'error' })
      }
      return
    }

    const originalTask = JSON.parse(JSON.stringify(tasks.value[taskIndex]))
    
    // 乐观更新UI
    Object.assign(tasks.value[taskIndex], updatedTask)

    try {
      await dataAdapter.updateTask(updatedTask._id, updatedTask)
      uni.showToast({ title: '保存成功', icon: 'success' })
    } catch (error) {
      console.error('任务更新失败:', error)
      // 回滚
      Object.assign(tasks.value[taskIndex], originalTask)
      uni.showToast({ title: error.message || '保存失败', icon: 'error' })
    }
  }

  /**
   * 乐观创建任务
   * @param {Object} newTaskData - 新任务的数据
   */
  const createTaskOptimistic = async (newTaskData) => {
    const tempId = `temp_${Date.now()}`
    const tempTask = {
      ...newTaskData,
      _id: tempId,
      status: 'todo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 乐观添加到列表
    tasks.value.unshift(tempTask)

    try {
      const result = await dataAdapter.createTask(newTaskData.todobook_id, newTaskData)
      
      if (result) {
        // 成功后，用真实数据替换临时数据
        const taskIndex = tasks.value.findIndex(t => t._id === tempId)
        if (taskIndex !== -1) {
          tasks.value[taskIndex] = result
        }
        uni.showToast({ title: '创建成功', icon: 'success' })
      } else {
        throw new Error('创建失败')
      }
    } catch (error) {
      // 失败后，从列表中移除临时任务
      const taskIndex = tasks.value.findIndex(t => t._id === tempId)
      if (taskIndex !== -1) {
        tasks.value.splice(taskIndex, 1)
      }
      uni.showToast({ title: error.message || '创建失败', icon: 'error' })
    }
  }
  
  /**
   * 更新当前bookId
   * @param {string} newBookId - 新的项目册ID
   */
  const updateBookId = (newBookId) => {
    currentBookId.value = newBookId
  }
  
  /**
   * 初始化排序状态，从本地存储加载偏好
   * 需要在bookId和currentUserId都准备好后调用
   */
  const initializeSortFromStorage = () => {
    if (!currentBookId.value || !currentUserId.value) {
      console.log('⚠️ 初始化排序跳过 - 缺少必要参数')
      return
    }
    
    const savedSort = loadSortFromStorage(currentBookId.value)
    
    // 只有当加载的排序与当前不同时才更新
    if (savedSort.field !== currentSort.value.field || savedSort.order !== currentSort.value.order) {
      currentSort.value = { ...savedSort }
    } 
  }
  
  return {
    // 响应式数据
    tasks,
    loading,
    error,
    activeFilter,
    searchKeyword,
    selectedTags,
    currentSort,
    
    // 计算属性
    filteredTasks,
    sortedTasks,
    taskStats,
    overallProgress,
    filterTabs,
    availableTags,
    
    // 方法
    initializeTasks,
    loadAvailableTags,
    toggleTaskStatus,
    toggleSubtaskStatus,
    deleteTask,
    setActiveFilter,
    setSearchKeyword,
    setSelectedTags,
    setSortOption,
    updateBookId,
    initializeSortFromStorage,
    resetState,
    updateTaskOptimistic,
    createTaskOptimistic,
    
    // 新增：缓存管理方法
    clearCommentCache,
    getTaskUnreadCount,
    loadTasksCommentCounts // 降级方案
  }
}