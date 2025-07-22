// 更新任务状态

const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkTaskPermission } = require('../../lib/utils/permission')
const { handleParentChildStatusUpdate } = require('../../lib/utils/database')
const { ERROR_CODES, PERMISSION_TYPE, TASK_STATUS } = require('../../common/constants')

/**
 * 更新任务状态
 * @param {string} itemId 任务ID
 * @param {string} status 新状态
 * @returns {Object} 响应结果
 */
async function updateTodoItemStatus(itemId, status) {
  const { uid, db } = this
  
  try {
    // 权限检查和获取任务信息
    const permissionResult = await checkTaskPermission(this, uid, itemId, PERMISSION_TYPE.WRITE)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    const { task } = permissionResult
    
    const updates = {
      status,
      updated_at: new Date(),
      last_activity_at: new Date()
    }
    
    // 如果任务完成，设置完成时间
    if (status === TASK_STATUS.COMPLETED) {
      updates.completed_at = new Date()
    } else {
      updates.completed_at = null
    }
    
    // 更新当前任务状态
    await db.collection('todoitems').doc(itemId).update(updates)
    
    // 处理父子关系的状态联动
    await handleParentChildStatusUpdate(this, task, status)
    
    // 更新项目册的完成计数
    if (status === TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.COMPLETED) {
      await db.collection('todobooks')
        .doc(task.todobook_id)
        .update({
          completed_count: db.command.inc(1),
          last_activity_at: new Date()
        })
    } else if (status !== TASK_STATUS.COMPLETED && task.status === TASK_STATUS.COMPLETED) {
      await db.collection('todobooks')
        .doc(task.todobook_id)
        .update({
          completed_count: db.command.inc(-1),
          last_activity_at: new Date()
        })
    }
    
    return createSuccessResponse(null, '任务状态更新成功')
  } catch (error) {
    console.error('更新任务状态失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '更新任务状态失败')
  }
}

module.exports = updateTodoItemStatus