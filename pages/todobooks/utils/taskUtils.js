import { TASK_CONSTANTS } from './constants.js'

/**
 * 组织父子任务关系
 * @param {Array} allTasks - 所有任务数组
 * @returns {Array} 组织后的父任务数组（包含子任务）
 */
export function organizeParentChildTasks(allTasks) {
  console.log(`🔍 [taskUtils调试] 开始组织 ${allTasks.length} 个任务的父子关系`)
  
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
  
  console.log(`🔍 [taskUtils调试] 分离结果: 父任务 ${parentTasks.length}个, 子任务 ${childTasks.length}个`)
  
  // 将子任务关联到父任务
  let successfullyLinked = 0
  let failedToLink = 0
  
  childTasks.forEach(childTask => {
    const parentTask = taskMap[childTask.parent_id]
    if (parentTask) {
      parentTask.subtasks.push(taskMap[childTask._id])
      successfullyLinked++
      console.log(`🔍 [taskUtils调试] 成功关联: 子任务 ${childTask._id} (${childTask.title}) -> 父任务 ${childTask.parent_id}`)
    } else {
      failedToLink++
      console.error(`🔍 [taskUtils调试] 关联失败: 子任务 ${childTask._id} (${childTask.title}) 找不到父任务 ${childTask.parent_id}`)
    }
  })
  
  console.log(`🔍 [taskUtils调试] 关联结果: 成功 ${successfullyLinked}个, 失败 ${failedToLink}个`)
  
  // 对子任务进行排序，并更新父任务的子任务计数
  parentTasks.forEach(parent => {
    if (parent.subtasks.length > 0) {
      parent.subtasks.sort((a, b) => {
        // 按照sort_order排序，如果没有则按创建时间
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          return a.sort_order - b.sort_order
        }
        return new Date(a.created_at) - new Date(b.created_at)
      })
      
      // 更新父任务的子任务计数和完成计数
      parent.subtask_count = parent.subtasks.length
      parent.completed_subtask_count = parent.subtasks.filter(subtask => subtask.status === 'completed').length
      
      console.log(`🔍 [taskUtils调试] 更新父任务 ${parent._id} 子任务计数: ${parent.subtask_count}, 完成计数: ${parent.completed_subtask_count}`)
    } else {
      // 确保没有子任务的父任务计数为0
      parent.subtask_count = 0
      parent.completed_subtask_count = 0
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