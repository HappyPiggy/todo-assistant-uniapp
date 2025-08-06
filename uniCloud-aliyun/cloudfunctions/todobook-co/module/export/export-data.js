// 导出项目册完整数据

const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { ERROR_CODES } = require('../../common/constants')

/**
 * 导出项目册完整数据
 * @param {string} bookId - 项目册ID
 * @returns {Object} 导出的完整数据
 */
async function exportTodoBookData(bookId) {
  const { uid, db } = this
  
  try {
    // 1. 并行获取所有相关数据
    const [bookResult, tasksResult] = await Promise.all([
      // 项目册基本信息
      db.collection('todobooks').doc(bookId).get(),
      // 所有任务数据
      db.collection('todoitems')
        .where({ todobook_id: bookId })
        .orderBy('sort_order', 'asc')
        .orderBy('created_at', 'desc')
        .get()
    ])
    
    // 2. 数据验证
    if (!bookResult.data.length) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, '项目册不存在')
    }
    
    // 3. 组织导出数据结构，包含所有数据库字段
    const exportData = {
      metadata: {
        exportVersion: '1.0.0',
        exportTime: new Date().toISOString(),
        exportBy: uid,
        dataType: 'todobook-full-export'
      },
      todobook: bookResult.data[0], // 包含所有项目册字段
      tasks: organizeTasks(tasksResult.data), // 包含所有任务字段，保持层级结构
      statistics: generateStatistics(tasksResult.data)
    }
    
    // 4. 记录导出操作日志
    await logExportOperation(uid, bookId)
    
    return createSuccessResponse(exportData)
  } catch (error) {
    console.error('导出项目册数据失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '导出数据失败')
  }
}

/**
 * 组织任务数据为层次结构，保留所有数据库字段
 * @param {Array} tasks - 原始任务数据
 * @returns {Array} 组织后的任务数据
 */
function organizeTasks(tasks) {
  const taskMap = new Map()
  const rootTasks = []
  
  // 构建任务映射，保留所有原始字段
  tasks.forEach(task => {
    taskMap.set(task._id, { ...task, subtasks: [] })
  })
  
  // 构建层次结构
  tasks.forEach(task => {
    if (task.parent_id && taskMap.has(task.parent_id)) {
      taskMap.get(task.parent_id).subtasks.push(taskMap.get(task._id))
    } else {
      rootTasks.push(taskMap.get(task._id))
    }
  })
  
  return rootTasks
}

/**
 * 生成统计信息
 * @param {Array} tasks - 任务数据
 * @returns {Object} 统计信息
 */
function generateStatistics(tasks) {
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const todo = tasks.filter(t => t.status === 'todo').length
  const cancelled = tasks.filter(t => t.status === 'cancelled').length
  
  return {
    taskCounts: { total, completed, inProgress, todo, cancelled },
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    priorityDistribution: {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    }
  }
}

/**
 * 记录导出操作日志
 * @param {string} uid - 用户ID
 * @param {string} bookId - 项目册ID
 */
async function logExportOperation(uid, bookId) {
  try {
    // 记录到控制台日志
    console.log(`数据导出记录: 用户${uid}导出项目册${bookId}数据, 时间:${new Date().toISOString()}`)
    
    // 如果需要持久化日志，可以写入数据库
    // await db.collection('operation_logs').add({
    //   user_id: uid,
    //   todobook_id: bookId,
    //   operation: 'export_data',
    //   timestamp: new Date()
    // })
  } catch (error) {
    console.error('记录导出日志失败:', error)
    // 日志记录失败不影响导出功能
  }
}

module.exports = exportTodoBookData