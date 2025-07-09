import { ref, computed } from 'vue'
import { organizeParentChildTasks, calculateTaskStats, filterTasks, validateTaskCompletion } from '../utils/taskUtils.js'
import { calculateUnreadCount } from '@/utils/commentUtils.js'
import { API_CODES, ERROR_MESSAGES, TASK_CONSTANTS } from '../utils/constants.js'
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
  const currentUserId = computed(() => {
    return store.userInfo?._id || ''
  })
  
  const filteredTasks = computed(() => {
    return filterTasks(tasks.value, activeFilter.value)
  })
  
  const taskStats = computed(() => {
    return calculateTaskStats(tasks.value)
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
   * 加载任务列表
   * @param {string} id - 项目册ID
   */
  const loadTasks = async (id = bookId) => {
    if (!id) {
      error.value = '项目册ID不能为空'
      return
    }
    
    if (loading.value) return
    
    loading.value = true
    error.value = null
    
    try {
      const todoBooksObj = uniCloud.importObject('todobook-co')
      const result = await todoBooksObj.getTodoBookDetail(id)
      
      if (result.code === API_CODES.SUCCESS) {
        // 处理任务数据，确保格式正确
        const allTasks = (result.data.tasks || []).map(task => ({
          ...task,
          tags: Array.isArray(task.tags) ? task.tags : [],
          attachments: Array.isArray(task.attachments) ? task.attachments : [],
          expanded: false,
          subtasks: []
        }))
        
        // 组织父子关系：只显示父任务，子任务作为父任务的属性
        tasks.value = organizeParentChildTasks(allTasks)
        
        // 加载任务评论数据（用于显示未读提示）
        await loadTasksCommentCounts(allTasks)
      } else {
        error.value = result.message || ERROR_MESSAGES.DATA_NOT_FOUND
        uni.showToast({
          title: error.value,
          icon: 'none'
        })
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
      uni.stopPullDownRefresh()
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
        handleLocalParentChildUpdate(task, newStatus)
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
  const handleLocalParentChildUpdate = (task, newStatus) => {
    // 如果是子任务，更新父任务的完成子任务计数
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
        }
        // 如果父任务已完成但有子任务变为未完成，父任务回退
        else if (parentTask.completed_subtask_count < parentTask.subtask_count && 
                 parentTask.status === TASK_CONSTANTS.STATUS.COMPLETED) {
          parentTask.status = TASK_CONSTANTS.STATUS.TODO
          parentTask.completed_at = null
          parentTask.updated_at = new Date()
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
   * 切换任务展开状态
   * @param {Object} task - 任务对象
   */
  const toggleTaskExpand = (task) => {
    task.expanded = !task.expanded
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
        // 重新加载任务列表
        await loadTasks(bookId)
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
   * 更新任务排序
   * @param {string} taskId - 任务ID
   * @param {number} newOrder - 新排序
   */
  const updateTaskOrder = async (taskId, newOrder) => {
    try {
      const todoBooksObj = uniCloud.importObject('todobook-co')
      const result = await todoBooksObj.updateTaskOrder(taskId, newOrder)
      
      if (result.code !== API_CODES.SUCCESS) {
        throw new Error(result.message || ERROR_MESSAGES.OPERATION_FAILED)
      }
      
      return result
    } catch (err) {
      console.error('更新任务排序失败:', err)
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
   * 获取未读评论数量
   * @param {string} taskId - 任务ID
   * @returns {number} 未读数量
   */
  const getUnreadCommentCount = (taskId) => {
    try {
      // 先在父任务中查找
      let task = tasks.value.find(t => t._id === taskId)
      
      // 如果没找到，则在子任务中查找
      if (!task) {
        for (const parentTask of tasks.value) {
          if (parentTask.subtasks && parentTask.subtasks.length > 0) {
            task = parentTask.subtasks.find(subtask => subtask._id === taskId)
            if (task) break
          }
        }
      }
      
      if (!task || !task.comments || task.comments.length === 0) {
        return 0
      }
      
      // 使用工具函数计算未读数量
      return calculateUnreadCount(taskId, task.comments, currentUserId.value)
    } catch (error) {
      console.error('计算未读评论数量失败:', error)
      return 0
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
   * 刷新数据
   */
  const refreshData = async () => {
    await loadTasks(bookId)
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
  
  return {
    // 响应式数据
    tasks,
    loading,
    error,
    activeFilter,
    
    // 计算属性
    currentUserId,
    filteredTasks,
    taskStats,
    filterTabs,
    
    // 方法
    loadTasks,
    toggleTaskStatus,
    toggleTaskExpand,
    deleteTask,
    updateTaskOrder,
    getUnreadCommentCount,
    setActiveFilter,
    refreshData,
    resetState
  }
}