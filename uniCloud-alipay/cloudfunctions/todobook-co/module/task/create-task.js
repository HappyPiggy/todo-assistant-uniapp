// 创建任务

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { 
  createSuccessResponse, 
  createErrorResponse, 
  validateStringParam 
} = require('../../common/utils')
const { checkTodoBookPermission } = require('../../lib/utils/permission')
const { updateTodoBookStats } = require('../../lib/utils/database')
const { ERROR_CODES, PERMISSION_TYPE, TASK_STATUS, TASK_PRIORITY } = require('../../common/constants')

/**
 * 创建任务
 * @param {Object} itemData 任务数据
 * @param {string} itemData.todobook_id 项目册ID
 * @param {string} itemData.title 任务标题
 * @param {string} itemData.description 任务描述
 * @param {string} itemData.parent_id 父任务ID
 * @param {string} itemData.priority 任务优先级
 * @param {Date} itemData.due_date 截止日期
 * @returns {Object} 响应结果
 */
async function createTodoItem(itemData) {
  // 认证验证
  const authResult = await validateAuth(this)
  if (!authResult.success) {
    return authResult.error
  }
  
  const { uid } = authResult
  const db = getDatabase(this)
  
  const { 
    todobook_id, 
    title, 
    description = '', 
    parent_id = null,
    priority = TASK_PRIORITY.MEDIUM,
    due_date = null,
    tags = [],
    estimated_hours = 0
  } = itemData
  
  // 验证任务标题
  const titleValidation = validateStringParam(title, '任务标题', 1, 200)
  if (titleValidation) {
    return titleValidation
  }
  
  try {
    // 权限检查
    const permissionResult = await checkTodoBookPermission(this, uid, todobook_id, PERMISSION_TYPE.WRITE)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    const now = new Date()
    const newItem = {
      todobook_id,
      parent_id,
      title: title.trim(),
      description,
      creator_id: uid,
      assignee_id: uid,
      created_at: now,
      updated_at: now,
      due_date: due_date ? new Date(due_date) : null,
      status: TASK_STATUS.TODO,
      priority,
      tags: tags || [],
      sort_order: 0,
      level: parent_id ? 1 : 0,
      progress: 0,
      estimated_hours: typeof estimated_hours === 'number' ? estimated_hours : 0,
      actual_hours: 0,
      attachments: [],
      comments: [],
      subtask_count: 0,
      completed_subtask_count: 0,
      is_recurring: false,
      last_activity_at: now
    }
    
    // 创建任务
    const result = await db.collection('todoitems').add(newItem)
    
    // 更新项目册任务计数
    await updateTodoBookStats(this, todobook_id, {
      item_count: db.command.inc(1)
    })
    
    // 如果有父任务，更新父任务的子任务计数
    if (parent_id) {
      await db.collection('todoitems')
        .doc(parent_id)
        .update({
          subtask_count: db.command.inc(1),
          updated_at: now
        })
    }
    
    return createSuccessResponse({
      _id: result.id,
      ...newItem
    }, '创建任务成功')
  } catch (error) {
    console.error('创建任务失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '创建任务失败')
  }
}

module.exports = createTodoItem