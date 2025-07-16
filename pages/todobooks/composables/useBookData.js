import { ref, computed } from 'vue'
import { API_CODES, ERROR_MESSAGES } from '@/pages/todobooks/utils/constants.js'
import globalStore from '@/store/index.js'

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

  /**
   * 加载 TodoBook 列表
   * @param {Object} options - 加载选项
   * @param {boolean} forceRefresh - 是否强制刷新（跳过缓存）
   * @returns {Promise<Array>} TodoBook 列表
   */
  const loadTodoBooks = async (options = {}, forceRefresh = false) => {
    if (!forceRefresh) {
      // 优先从缓存获取数据
      const cached = globalStore.todoBook.getTodoBooksFromCache()
      if (cached.success) {
        console.log('使用缓存数据:', cached.source)
        return cached.data
      }
    }

    // 缓存无效或强制刷新，从云端加载
    console.log(forceRefresh ? '强制刷新项目册...' : '缓存无效，从云端加载')
    const books = await globalStore.todoBook.loadTodoBooks({
      include_archived: false,
      ...options
    }, forceRefresh)

    return books
  }

  /**
   * 归档项目册
   * @param {string} bookId - 项目册ID
   * @returns {Promise<void>}
   */
  const archiveTodoBook = async (bookId) => {
    await globalStore.todoBook.updateTodoBook(bookId, {
      is_archived: true,
      archived_at: new Date()
    })
  }

  /**
   * 删除项目册
   * @param {string} bookId - 项目册ID
   * @returns {Promise<void>}
   */
  const deleteTodoBook = async (bookId) => {
    await globalStore.todoBook.deleteTodoBook(bookId)
  }

  /**
   * 创建项目册
   * @param {Object} bookData - 项目册数据
   * @returns {Promise<Object>} 创建的项目册
   */
  const createTodoBook = async (bookData) => {
    return await globalStore.todoBook.createTodoBook(bookData)
  }

  /**
   * 更新项目册
   * @param {string} bookId - 项目册ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的项目册
   */
  const updateTodoBook = async (bookId, updates) => {
    return await globalStore.todoBook.updateTodoBook(bookId, updates)
  }

  /**
   * 加载项目册详情
   * @param {string} id - 项目册ID
   * @param {boolean} loadTasks - 是否同时加载任务数据用于统计
   */
  const loadBookDetail = async (id, loadTasks = false) => {
    if (!id) {
      console.log('loadBookDetail 错误: 项目册ID不能为空')
      error.value = '项目册ID不能为空'
      return
    }
    
    if (loading.value) {
      console.log('loadBookDetail 跳过: 正在加载中')
      return
    }
    
    console.log('设置 loading = true')
    loading.value = true
    error.value = null
    
    try {
      const todoBooksObj = uniCloud.importObject('todobook-co')
      
      const result = await todoBooksObj.getTodoBookDetail(id)
      
      if (result.code === API_CODES.SUCCESS) {
        bookData.value = result.data.book
        memberCount.value = result.data.members ? result.data.members.length : 0
        
        // 如果需要加载任务数据，进行扁平化处理
        if (loadTasks && result.data.tasks) {
          const tasks = result.data.tasks || []
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
        
        // 设置页面标题
        if (bookData.value && bookData.value.title) {
          uni.setNavigationBarTitle({
            title: bookData.value.title
          })
        }
      } else {
        console.log('loadBookDetail 失败, 错误信息:', result.message)
        error.value = result.message || ERROR_MESSAGES.DATA_NOT_FOUND
        uni.showToast({
          title: error.value,
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('加载项目册详情失败:', err)
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
   * 专门用于统计数据的加载方法
   * @param {string} todoBooksId - 项目册ID
   */
  const loadStatisticsData = async (todoBooksId) => {
    if (!todoBooksId) {
      error.value = '缺少项目册ID'
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoBookDetail({ 
        bookId: todoBooksId 
      })
      
      if (result.code === 0) {
        bookData.value = result.data.book || result.data
        
        // 获取任务数据并扁平化
        const tasks = result.data.tasks || []
        const flatTasks = []
        
        tasks.forEach(task => {
          flatTasks.push(task)
          if (task.subtasks && task.subtasks.length > 0) {
            flatTasks.push(...task.subtasks)
          }
        })
        
        allTasks.value = flatTasks
        
        console.log(`统计数据加载完成: 项目册=${bookData.value.title}, 任务数=${flatTasks.length}`)
      } else {
        throw new Error(result.message || '加载统计数据失败')
      }
    } catch (err) {
      console.error('加载统计数据失败:', err)
      error.value = err.message || '加载统计数据失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新统计数据
   * @param {string} todoBooksId - 项目册ID
   */
  const refreshStatistics = async (todoBooksId) => {
    if (!todoBooksId) return
    
    chartLoading.value = true
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoBookDetail({ 
        bookId: todoBooksId
      })
      
      if (result.code === 0) {
        const tasks = result.data.tasks || []
        const flatTasks = []
        
        tasks.forEach(task => {
          flatTasks.push(task)
          if (task.subtasks && task.subtasks.length > 0) {
            flatTasks.push(...task.subtasks)
          }
        })
        
        allTasks.value = flatTasks
        console.log('统计数据刷新完成')
      }
    } catch (err) {
      console.error('刷新统计数据失败:', err)
    } finally {
      chartLoading.value = false
    }
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
        actualHours: task.actual_hours || 0,
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
    const totalActualHours = allTasks.value.reduce((sum, task) => 
      sum + (task.actual_hours || 0), 0
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
      totalEstimatedHours,
      totalActualHours,
      hoursVariance: totalActualHours - totalEstimatedHours
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
    
    // 统计计算属性
    timelineData,
    statsOverview,
    distributionData,
    timeAnalysisData,
    
    // 基础方法
    loadBookDetail,
    loadTodoBooks,
    archiveTodoBook,
    deleteTodoBook,
    createTodoBook,
    updateTodoBook,
    
    // 统计方法
    loadStatisticsData,
    refreshStatistics
  }
}