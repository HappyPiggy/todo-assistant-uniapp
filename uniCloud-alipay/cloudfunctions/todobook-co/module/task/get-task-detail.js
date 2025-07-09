// 获取任务详情

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkTaskPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 获取任务详情（包含子任务）
 * @param {string} taskId 任务ID
 * @returns {Object} 响应结果
 */
async function getTaskDetail(taskId) {
  // 认证验证
  const authResult = await validateAuth(this)
  if (!authResult.success) {
    return authResult.error
  }
  
  const { uid } = authResult
  const db = getDatabase(this)
  
  try {
    // 权限检查和获取任务信息
    const permissionResult = await checkTaskPermission(this, uid, taskId, PERMISSION_TYPE.READ)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    const { task } = permissionResult
    
    // 获取子任务
    const subtasksResult = await db.collection('todoitems')
      .where({ parent_id: taskId })
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'asc')
      .get()
    
    // 获取负责人信息
    let assigneeInfo = null
    if (task.assignee_id) {
      try {
        const assigneeResult = await db.collection('uni-id-users')
          .where({ _id: task.assignee_id })
          .field({ _id: true, nickname: true, username: true, avatar_file: true })
          .get()
        
        if (assigneeResult.data.length > 0) {
          assigneeInfo = assigneeResult.data[0]
        }
      } catch (error) {
        console.error('获取负责人信息失败:', error)
      }
    }
    
    // 获取项目册创建者信息（用于权限判断）
    let todobook_creator_id = null
    try {
      const bookResult = await db.collection('todobooks')
        .where({ _id: task.todobook_id })
        .field({ creator_id: true })
        .get()
      
      if (bookResult.data.length > 0) {
        todobook_creator_id = bookResult.data[0].creator_id
      }
    } catch (error) {
      console.error('获取项目册创建者信息失败:', error)
    }
    
    return createSuccessResponse({
      task: task,
      subtasks: subtasksResult.data,
      assignee: assigneeInfo,
      todobook_creator_id: todobook_creator_id
    })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取任务详情失败')
  }
}

module.exports = getTaskDetail