import { TASK_CONSTANTS } from './constants.js'

/**
 * 组织父子任务关系
 * @param {Array} allTasks - 所有任务数组
 * @returns {Array} 组织后的父任务数组（包含子任务）
 */
export function organizeParentChildTasks(allTasks) {
  // 创建任务映射
  const taskMap = {}
  allTasks.forEach(task => {
    taskMap[task._id] = {
      ...task,
      subtasks: [],
      expanded: false
    }
  })
  
  // 分离父任务和子任务
  const parentTasks = []
  const childTasks = []
  
  allTasks.forEach(task => {
    if (task.parent_id) {
      childTasks.push(task)
    } else {
      parentTasks.push(taskMap[task._id])
    }
  })
  
  // 将子任务关联到父任务
  childTasks.forEach(childTask => {
    const parentTask = taskMap[childTask.parent_id]
    if (parentTask) {
      parentTask.subtasks.push(taskMap[childTask._id])
    }
  })
  
  // 对子任务进行排序
  parentTasks.forEach(parent => {
    if (parent.subtasks.length > 0) {
      parent.subtasks.sort((a, b) => {
        // 按照sort_order排序，如果没有则按创建时间
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          return a.sort_order - b.sort_order
        }
        return new Date(a.created_at) - new Date(b.created_at)
      })
    }
  })
  
  // 返回只包含父任务的数组
  return parentTasks.sort((a, b) => {
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      return a.sort_order - b.sort_order
    }
    return new Date(a.created_at) - new Date(b.created_at)
  })
}

/**
 * 获取优先级文本
 * @param {string} priority - 优先级值
 * @returns {string} 优先级文本
 */
export function getPriorityText(priority) {
  return TASK_CONSTANTS.PRIORITY_MAP[priority] || '中'
}

/**
 * 获取状态文本
 * @param {string} status - 状态值
 * @returns {string} 状态文本
 */
export function getStatusText(status) {
  return TASK_CONSTANTS.STATUS_MAP[status] || '待办'
}

/**
 * 检查任务是否过期
 * @param {string|Date} dueDate - 截止日期
 * @returns {boolean} 是否过期
 */
export function isTaskOverdue(dueDate) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

/**
 * 格式化截止日期
 * @param {string|Date} dueDate - 截止日期
 * @returns {string} 格式化后的日期
 */
export function formatDueDate(dueDate) {
  if (!dueDate) return ''
  
  const date = new Date(dueDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === -1) return '昨天'
  if (diffDays > 0) return `${diffDays}天后`
  return `逾期${Math.abs(diffDays)}天`
}

/**
 * 计算任务统计信息
 * @param {Array} tasks - 任务数组
 * @returns {Object} 统计信息
 */
export function calculateTaskStats(tasks) {
  const stats = {
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  }
  
  // 只统计父任务（顶级任务）
  tasks.forEach(task => {
    stats.total++
    switch (task.status) {
      case TASK_CONSTANTS.STATUS.COMPLETED:
        stats.completed++
        break
      case TASK_CONSTANTS.STATUS.IN_PROGRESS:
        stats.inProgress++
        break
      case TASK_CONSTANTS.STATUS.CANCELLED:
        stats.cancelled++
        break
      default:
        stats.todo++
    }
  })
  
  return stats
}

/**
 * 筛选任务
 * @param {Array} tasks - 任务数组
 * @param {string} filter - 筛选条件
 * @returns {Array} 筛选后的任务数组
 */
export function filterTasks(tasks, filter) {
  if (filter === 'all') {
    return tasks
  }
  
  return tasks.filter(task => {
    if (filter === 'completed') {
      // 已完成列表：只显示状态为completed的父任务
      return task.status === TASK_CONSTANTS.STATUS.COMPLETED
    } else if (filter === 'todo') {
      // 待办列表：显示状态不是completed的父任务
      return task.status !== TASK_CONSTANTS.STATUS.COMPLETED
    }
    
    return false
  })
}

/**
 * 验证任务是否可以完成
 * @param {Object} task - 任务对象
 * @returns {Object} 验证结果
 */
export function validateTaskCompletion(task) {
  // 如果有子任务，不允许手动切换状态
  if (task.subtask_count > 0) {
    return {
      canComplete: false,
      message: '有子任务的任务不能手动切换状态'
    }
  }
  
  return {
    canComplete: true,
    message: ''
  }
}

/**
 * 更新父子任务状态
 * @param {Object} task - 任务对象
 * @param {string} newStatus - 新状态
 * @param {Array} allTasks - 所有任务数组
 * @returns {Array} 更新后的任务数组
 */
export function updateParentChildTaskStatus(task, newStatus, allTasks) {
  const updatedTasks = [...allTasks]
  
  // 如果是子任务，更新父任务的完成子任务计数
  if (task.parent_id) {
    const parentTask = updatedTasks.find(t => t._id === task.parent_id)
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
  
  return updatedTasks
}

/**
 * 获取任务进度百分比
 * @param {Object} task - 任务对象
 * @returns {number} 进度百分比
 */
export function getTaskProgress(task) {
  if (!task.subtask_count || task.subtask_count === 0) {
    return task.status === TASK_CONSTANTS.STATUS.COMPLETED ? 100 : 0
  }
  
  return Math.round((task.completed_subtask_count / task.subtask_count) * 100)
}

/**
 * 生成任务摘要
 * @param {Object} task - 任务对象
 * @returns {string} 任务摘要
 */
export function generateTaskSummary(task) {
  const parts = []
  
  // 优先级
  if (task.priority && task.priority !== TASK_CONSTANTS.PRIORITY.MEDIUM) {
    parts.push(`${getPriorityText(task.priority)}优先级`)
  }
  
  // 截止日期
  if (task.due_date) {
    const dateText = formatDueDate(task.due_date)
    parts.push(`截止${dateText}`)
  }
  
  // 子任务
  if (task.subtask_count > 0) {
    parts.push(`${task.completed_subtask_count}/${task.subtask_count}子任务`)
  }
  
  return parts.join('，')
}

/**
 * 检查任务权限
 * @param {Object} task - 任务对象
 * @param {string} userId - 用户ID
 * @param {string} action - 操作类型
 * @returns {boolean} 是否有权限
 */
export function checkTaskPermission(task, userId, action) {
  if (!task || !userId) return false
  
  // 创建者总是有所有权限
  if (task.creator_id === userId) return true
  
  // 指派的执行者有编辑权限
  if (task.assignee_id === userId && ['edit', 'update', 'complete'].includes(action)) {
    return true
  }
  
  // 其他情况根据具体需求决定
  return false
}

/**
 * 格式化任务时间信息
 * @param {Object} task - 任务对象
 * @returns {Object} 时间信息
 */
export function formatTaskTime(task) {
  const result = {}
  
  if (task.created_at) {
    result.created = formatRelativeTime(task.created_at)
  }
  
  if (task.updated_at) {
    result.updated = formatRelativeTime(task.updated_at)
  }
  
  if (task.completed_at) {
    result.completed = formatRelativeTime(task.completed_at)
  }
  
  if (task.due_date) {
    result.due = formatDueDate(task.due_date)
    result.overdue = isTaskOverdue(task.due_date)
  }
  
  return result
}

/**
 * 格式化相对时间
 * @param {string|Date} time - 时间
 * @returns {string} 相对时间文本
 */
function formatRelativeTime(time) {
  if (!time) return ''
  
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  
  return date.toLocaleDateString()
}