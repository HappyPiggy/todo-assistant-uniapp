import { ref, computed } from 'vue'
import { organizeParentChildTasks, calculateTaskStats, filterTasks, validateTaskCompletion } from '@/pages/todobooks/utils/taskUtils.js'
import { calculateUnreadCount } from '@/utils/commentUtils.js'
import { API_CODES, ERROR_MESSAGES, TASK_CONSTANTS } from '@/pages/todobooks/utils/constants.js'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'

/**
 * 任务数据管理组合式函数
 * @param {string} bookId - 项目册ID
 * @returns {Object} 任务数据和操作方法
 */
export function useTaskData(bookId) {
  // 响应式数据
  const tasks = ref([])
  const loading = ref(false)
  const error = ref(null)
  const activeFilter = ref('all')
  
  // 计算属性
  const filteredTasks = computed(() => {
    return filterTasks(tasks.value, activeFilter.value)
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
      
      // 处理任务数据，确保格式正确
      const processedTasks = tasks.value.map(task => ({
        ...task,
        tags: Array.isArray(task.tags) ? task.tags : [],
        attachments: Array.isArray(task.attachments) ? task.attachments : [],
        expanded: false,
        subtasks: []
      }))
      
      // 组织父子关系：只显示父任务，子任务作为父任务的属性
      tasks.value = organizeParentChildTasks(processedTasks)
      
      // 加载任务评论数据（用于显示未读提示）
      await loadTasksCommentCounts(processedTasks)
      
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
      const todoBooksObj = uniCloud.importObject('todobook-co')
      const result = await todoBooksObj.updateTodoItemStatus(task._id, newStatus)
      
      if (result.code === API_CODES.SUCCESS) {
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
        
        throw new Error(result.message || ERROR_MESSAGES.OPERATION_FAILED)
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
          
          // 调用云函数更新父任务状态
          try {
            const todoBooksObj = uniCloud.importObject('todobook-co')
            await todoBooksObj.updateTodoItemStatus(parentTask._id, TASK_CONSTANTS.STATUS.COMPLETED)
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
          
          // 调用云函数更新父任务状态
          try {
            const todoBooksObj = uniCloud.importObject('todobook-co')
            await todoBooksObj.updateTodoItemStatus(parentTask._id, TASK_CONSTANTS.STATUS.TODO)
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
      const todoBooksObj = uniCloud.importObject('todobook-co')
      const result = await todoBooksObj.deleteTask(taskId)
      
      if (result.code === API_CODES.SUCCESS) {
        return result
      } else {
        throw new Error(result.message || ERROR_MESSAGES.OPERATION_FAILED)
      }
    } catch (err) {
      console.error('删除任务失败:', err)
      throw err
    }
  }
  
  /**
   * 加载任务评论数据
   * @param {Array} allTasks - 所有任务数组
   */
  const loadTasksCommentCounts = async (allTasks) => {
    try {
      const todoBooksObj = uniCloud.importObject('todobook-co')
      
      // 并行获取每个任务的评论数据
      const commentPromises = allTasks.map(async task => {
        try {
          // 获取前50条评论，这样可以获取到评论的创建时间等详细信息
          const result = await todoBooksObj.getTaskComments(task._id, 1, 50)
          
          if (result.code === API_CODES.SUCCESS) {
            return {
              taskId: task._id,
              comments: result.data.comments, // 保持原有结构
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
      
      // 确保子任务也能获取到评论数据（从allTasks中同步到tasks.value的子任务中）
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
      console.error('加载评论数据失败:', error)
    }
  }
  
  /**
   * 切换子任务状态
   * @param {Object} subtask - 子任务对象
   */
  const toggleSubtaskStatus = async (subtask) => {
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
      const todoBooksObj = uniCloud.importObject('todobook-co')
      const result = await todoBooksObj.updateTodoItemStatus(subtask._id, newStatus)
      
      if (result.code === API_CODES.SUCCESS) {
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
   * 重置状态
   */
  const resetState = () => {
    tasks.value = []
    loading.value = false
    error.value = null
    activeFilter.value = 'all'
  }

  const overallProgress = computed(() => {
    const stats = taskStats.value
    if (stats.total === 0) return 0
    return Math.round((stats.completed / stats.total) * 100)
  })
  
  
  return {
    // 响应式数据
    tasks,
    loading,
    error,
    activeFilter,
    
    // 计算属性
    filteredTasks,
    taskStats,
    overallProgress,
    filterTabs,
    
    // 方法
    initializeTasks,
    toggleTaskStatus,
    toggleSubtaskStatus,
    deleteTask,
    setActiveFilter,
    resetState
  }
}