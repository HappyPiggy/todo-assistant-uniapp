import { ref, computed } from 'vue'
import { API_CODES, ERROR_MESSAGES } from '@/pages/todobooks/utils/constants.js'

/**
 * TodoBook 数据操作组合式函数
 * @returns {Object} TodoBook 操作方法
 */
export function useBookData() {
  // 响应式数据
  const bookData = ref({})
  const loading = ref(false)
  const error = ref(null)
  const memberCount = ref(0)
  const allTasks = ref([])
  const chartLoading = ref(false)
  const membersData = ref([])
  const membersLoading = ref(false)
  const tasksData = ref([])
  const tasksLoading = ref(false)

  /**
   * 加载 TodoBook 列表
   * @param {Object} options - 加载选项
   * @returns {Promise<Array>} TodoBook 列表
   */
  const loadTodoBooks = async (options = {}) => {
    // 直接从云端加载最新数据
    console.log('从云端加载项目册...')
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoBooks({
        include_archived: false,
        ...options
      })
      
      if (result.code === 0) {
        const books = result.data.list || result.data
        // 通知页面数据已更新
        uni.$emit('todobooks-updated', books)
        return books
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('加载项目册失败:', error)
      throw error
    }
  }

  /**
   * 归档项目册
   * @param {string} bookId - 项目册ID
   * @returns {Promise<void>}
   */
  const archiveTodoBook = async (bookId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.updateTodoBook(bookId, {
        is_archived: true,
        archived_at: new Date()
      })
      
      if (result.code === 0) {
        // 重新加载最新数据并通知页面
        await refreshTodoBooks()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('归档项目册失败:', error)
      throw error
    }
  }

  /**
   * 删除项目册
   * @param {string} bookId - 项目册ID
   * @returns {Promise<void>}
   */
  const deleteTodoBook = async (bookId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.deleteTodoBook(bookId)
      
      if (result.code === 0) {
        // 重新加载最新数据并通知页面
        await refreshTodoBooks()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('删除项目册失败:', error)
      throw error
    }
  }

  /**
   * 创建项目册
   * @param {Object} bookData - 项目册数据
   * @returns {Promise<Object>} 创建的项目册
   */
  const createTodoBook = async (bookData) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.createTodoBook(bookData)
      
      if (result.code === 0) {
        // 重新加载最新数据并通知页面
        await refreshTodoBooks()
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('创建项目册失败:', error)
      throw error
    }
  }

  /**
   * 更新项目册
   * @param {string} bookId - 项目册ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的项目册
   */
  const updateTodoBook = async (bookId, updates) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.updateTodoBook(bookId, updates)
      
      if (result.code === 0) {
        // 重新加载最新数据并通知页面
        await refreshTodoBooks()
        return result.data || updates
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('更新项目册失败:', error)
      throw error
    }
  }

  /**
   * 加载归档项目册列表
   * @param {Object} options - 加载选项
   * @returns {Promise<Array>} 归档的 TodoBook 列表
   */
  const loadArchivedTodoBooks = async (options = {}) => {
    console.log('从云端加载归档项目册...')
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoBooks({
        include_archived: true,
        archived_only: true,
        include_members: true,  // 归档管理需要成员信息用于统计
        ...options
      })
      
      if (result.code === 0) {
        const books = result.data.list || result.data
        console.log('归档项目册加载成功，数量:', books.length)
        return books
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('加载归档项目册失败:', error)
      throw error
    }
  }

  /**
   * 刷新项目册列表
   * @returns {Promise<Array>} TodoBook 列表
   */
  const refreshTodoBooks = async () => {
    return await loadTodoBooks({ include_archived: false })
  }

  /**
   * 清除项目册数据
   */
  const clearTodoBooks = () => {
    // 通知页面清除数据
    uni.$emit('todobooks-updated', [])
    console.log('项目册数据已清除')
  }

  /**
   * 用户切换时清理数据
   * @param {string} newUserId - 新用户ID
   */
  const onUserSwitch = (newUserId) => {
    console.log('检测到用户切换，清理数据')
    
    // 清除数据并通知页面
    uni.$emit('todobooks-updated', [])
    
    // 通知页面用户已切换，需要重新加载
    uni.$emit('user-switched', newUserId)
  }


  /**
   * 加载项目册详情
   * @param {string} id - 项目册ID
   * @param {Object} options - 加载选项
   * @param {boolean} options.includeBasic - 是否包含基本信息（默认true）
   * @param {boolean} options.includeMembers - 是否包含成员信息（默认false）
   * @param {boolean} options.includeTasks - 是否包含任务信息（默认false）
   */
  const loadBookDetail = async (id, options = {}) => {
    const {
      includeBasic = true,
      includeMembers = false,
      includeTasks = false,
    } = options
    
    if (!id) {
      console.log('loadBookDetail 错误: 项目册ID不能为空')
      error.value = '项目册ID不能为空'
      return
    }
    
    let loadingState = loading
    let loadingLabel = 'loading'
    
    if (loadingState.value) {
      console.log(`loadBookDetail 跳过: ${loadingLabel}正在加载中`)
      return
    }
    
    console.log(`设置 ${loadingLabel} = true`)
    loadingState.value = true
    error.value = null
    
    try {
      const todoBooksObj = uniCloud.importObject('todobook-co')
      
      const result = await todoBooksObj.getTodoBookDetail(id, {
        includeBasic,
        includeMembers,
        includeTasks
      })
      
      if (result.code === API_CODES.SUCCESS) {
        // 处理基本信息
        if (includeBasic && result.data.book) {
          bookData.value = result.data.book
          
          // 设置页面标题
          if (bookData.value && bookData.value.title) {
            uni.setNavigationBarTitle({
              title: bookData.value.title
            })
          }
        }
        
        // 处理成员信息
        if (includeMembers && result.data.members) {
          membersData.value = result.data.members
          memberCount.value = result.data.members.length
        }
        
        // 处理任务信息
        if (includeTasks && result.data.tasks) {
          const tasks = result.data.tasks || []
          tasksData.value = tasks
          
          // 扁平化处理任务数据用于统计
          const flatTasks = []
          tasks.forEach(task => {
            flatTasks.push(task)
            // 如果有子任务，也加入到扁平化数组中
            if (task.subtasks && task.subtasks.length > 0) {
              flatTasks.push(...task.subtasks)
            }
          })
          allTasks.value = flatTasks
        }
        
      } else {
        console.log('loadBookDetail 失败, 错误信息:', result.message)
        error.value = result.message || ERROR_MESSAGES.DATA_NOT_FOUND
        uni.showToast({
          title: result.message || ERROR_MESSAGES.DATA_NOT_FOUND,
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('加载项目册详情失败:', err)
      error.value = ERROR_MESSAGES.NETWORK_ERROR
      if (showToast) {
        uni.showToast({
          title: ERROR_MESSAGES.NETWORK_ERROR,
          icon: 'none'
        })
      }
    } finally {
      loadingState.value = false
    }
  }


  /**
   * 专门用于统计数据的加载方法（使用loadBookDetail实现）
   * @param {string} todoBooksId - 项目册ID
   */
  const loadStatisticsData = async (todoBooksId) => {
    return await loadBookDetail(todoBooksId, {
      includeBasic: true,
      includeMembers: false,
      includeTasks: true,
      setTitle: false,
      showToast: false,
      loadingType: 'main'
    })
  }

  /**
   * 刷新统计数据（使用loadBookDetail实现）
   * @param {string} todoBooksId - 项目册ID
   */
  const refreshStatistics = async (todoBooksId) => {
    if (!todoBooksId) return
    
    chartLoading.value = true
    try {
      await loadBookDetail(todoBooksId, {
        includeBasic: false,
        includeMembers: false,
        includeTasks: true,
        setTitle: false,
        showToast: false,
        loadingType: 'main'
      })
      console.log('统计数据刷新完成')
    } catch (err) {
      console.error('刷新统计数据失败:', err)
    } finally {
      chartLoading.value = false
    }
  }

  /**
   * 导出项目册完整数据
   * @param {string} bookId - 项目册ID
   * @returns {Promise<void>}
   */
  const exportTodoBookData = async (bookId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.exportTodoBookData(bookId)
      
      if (result.code === 0) {
        // 格式化导出数据为易读的JSON
        const exportData = JSON.stringify(result.data, null, 2)
        
        // 复制到剪切板
        await uni.setClipboardData({
          data: exportData
        })
        
        console.log('数据导出成功，已复制到剪切板')
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('导出项目册数据失败:', error)
      throw error
    }
  }

  // 获取已完成任务的时间线数据（供外部调用）
  const getCompletedTasksTimeline = () => {
    return allTasks.value
      .filter(task => task.status === 'completed' && task.completed_at)
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      .map((task, index) => ({
        ...task,
        index: index + 1,
        completedAt: task.completed_at
      }))
  }
  
  // 统计计算属性
  // 时序图数据 - 已完成任务的时间线
  const timelineData = computed(() => {
    return allTasks.value
      .filter(task => task.status === 'completed' && task.completed_at)
      .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
      .map((task, index) => ({
        id: task._id,
        title: task.title,
        completedAt: task.completed_at,
        priority: task.priority,
        estimatedHours: task.estimated_hours || 0,
        tags: task.tags || [],
        level: task.level || 0,
        index: index + 1
      }))
  })
  
  // 统计概览数据
  const statsOverview = computed(() => {
    const total = allTasks.value.length
    const completed = allTasks.value.filter(task => task.status === 'completed').length
    const inProgress = allTasks.value.filter(task => task.status === 'in_progress').length
    const todo = allTasks.value.filter(task => task.status === 'todo').length
    const cancelled = allTasks.value.filter(task => task.status === 'cancelled').length
    
    // 计算完成率
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    
    // 计算平均完成时间（天）
    const completedTasks = allTasks.value.filter(task => 
      task.status === 'completed' && task.created_at && task.completed_at
    )
    const avgCompletionDays = completedTasks.length > 0 
      ? Math.round(
          completedTasks.reduce((sum, task) => {
            const created = new Date(task.created_at)
            const completed = new Date(task.completed_at)
            return sum + Math.ceil((completed - created) / (1000 * 60 * 60 * 24))
          }, 0) / completedTasks.length
        )
      : 0
    
    // 计算逾期任务数量
    const now = new Date()
    const overdueTasks = allTasks.value.filter(task => 
      task.status !== 'completed' && 
      task.status !== 'cancelled' && 
      task.due_date && 
      new Date(task.due_date) < now
    ).length
    
    // 计算工时统计
    const totalEstimatedHours = allTasks.value.reduce((sum, task) => 
      sum + (task.estimated_hours || 0), 0
    )
    
    return {
      total,
      completed,
      inProgress,
      todo,
      cancelled,
      completionRate,
      avgCompletionDays,
      overdueTasks,
      totalEstimatedHours
    }
  })
  
  // 任务分布数据
  const distributionData = computed(() => {
    // 优先级分布
    const priorityDistribution = {
      urgent: allTasks.value.filter(task => task.priority === 'urgent').length,
      high: allTasks.value.filter(task => task.priority === 'high').length,
      medium: allTasks.value.filter(task => task.priority === 'medium').length,
      low: allTasks.value.filter(task => task.priority === 'low').length
    }
    
    // 状态分布
    const statusDistribution = {
      todo: allTasks.value.filter(task => task.status === 'todo').length,
      in_progress: allTasks.value.filter(task => task.status === 'in_progress').length,
      completed: allTasks.value.filter(task => task.status === 'completed').length,
      cancelled: allTasks.value.filter(task => task.status === 'cancelled').length
    }
    
    // 标签分布（前10个最常用的标签）
    const tagCount = {}
    allTasks.value.forEach(task => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => {
          const tagName = typeof tag === 'string' ? tag : tag.name || tag.label || ''
          if (tagName) {
            tagCount[tagName] = (tagCount[tagName] || 0) + 1
          }
        })
      }
    })
    
    const topTags = Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
    
    // 层级分布
    const levelDistribution = {
      level0: allTasks.value.filter(task => (task.level || 0) === 0).length,
      level1: allTasks.value.filter(task => (task.level || 0) === 1).length,
      level2: allTasks.value.filter(task => (task.level || 0) === 2).length
    }
    
    return {
      priorityDistribution,
      statusDistribution,
      topTags,
      levelDistribution
    }
  })
  
  // 时间分析数据
  const timeAnalysisData = computed(() => {
    const now = new Date()
    
    // 最近30天的任务完成趋势
    const dailyCompletions = {}
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      dailyCompletions[dateStr] = 0
    }
    
    allTasks.value
      .filter(task => task.status === 'completed' && task.completed_at)
      .forEach(task => {
        const completedDate = new Date(task.completed_at).toISOString().split('T')[0]
        if (dailyCompletions.hasOwnProperty(completedDate)) {
          dailyCompletions[completedDate]++
        }
      })
    
    const completionTrend = Object.entries(dailyCompletions)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, count]) => ({ date, count }))
    
    // 最近30天的任务创建趋势
    const dailyCreations = {}
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      dailyCreations[dateStr] = 0
    }
    
    allTasks.value
      .filter(task => task.created_at)
      .forEach(task => {
        const createdDate = new Date(task.created_at).toISOString().split('T')[0]
        if (dailyCreations.hasOwnProperty(createdDate)) {
          dailyCreations[createdDate]++
        }
      })
    
    const creationTrend = Object.entries(dailyCreations)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, count]) => ({ date, count }))
    
    // 工作效率分析（按小时统计完成任务数量）
    const hourlyEfficiency = {}
    for (let i = 0; i < 24; i++) {
      hourlyEfficiency[i] = 0
    }
    
    allTasks.value
      .filter(task => task.status === 'completed' && task.completed_at)
      .forEach(task => {
        const hour = new Date(task.completed_at).getHours()
        hourlyEfficiency[hour]++
      })
    
    const efficiencyByHour = Object.entries(hourlyEfficiency)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    
    return {
      completionTrend,
      creationTrend,
      efficiencyByHour
    }
  })

  return {
    // 响应式数据
    bookData,
    loading,
    error,
    memberCount,
    allTasks,
    chartLoading,
    membersData,
    membersLoading,
    tasksData,
    tasksLoading,
    
    // 统计计算属性
    timelineData,
    statsOverview,
    distributionData,
    timeAnalysisData,
    
    // 基础方法
    loadBookDetail,
    loadTodoBooks,
    loadArchivedTodoBooks,
    refreshTodoBooks,
    archiveTodoBook,
    deleteTodoBook,
    createTodoBook,
    updateTodoBook,
    clearTodoBooks,
    onUserSwitch,
    
    // 统计方法
    loadStatisticsData,
    refreshStatistics,
    getCompletedTasksTimeline,
    
    // 导出方法
    exportTodoBookData
  }
}