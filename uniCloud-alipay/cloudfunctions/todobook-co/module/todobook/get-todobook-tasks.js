// 获取项目册任务列表

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkTodoBookPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 获取项目册任务列表
 * @param {string} bookId 项目册ID
 * @returns {Object} 响应结果
 * 
 * 成功响应格式：
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: "任务ID",
 *       todobook_id: "项目册ID",
 *       title: "任务标题",
 *       description: "任务描述",
 *       status: "任务状态 (todo/in_progress/completed)",
 *       priority: "优先级 (low/medium/high/urgent)",
 *       sort_order: "排序号",
 *       created_at: "创建时间",
 *       updated_at: "更新时间",
 *       creator_id: "创建者ID",
 *       assignee_id: "指派人ID",
 *       due_date: "截止日期",
 *       completed_at: "完成时间"
 *     }
 *   ]
 * }
 * 
 * 错误响应格式：
 * {
 *   success: false,
 *   error: {
 *     code: "错误码",
 *     message: "错误信息"
 *   }
 * }
 * 
 * 可能的错误情况：
 * - 认证失败：用户未登录或token无效
 * - 权限不足：用户没有读取该项目册的权限
 * - 项目册不存在：指定的项目册ID不存在
 * - 内部错误：服务器内部错误
 */
async function getTodoBookTasks(bookId) {
  // 认证验证
  const authResult = await validateAuth(this)
  if (!authResult.success) {
    return authResult.error
  }
  
  const { uid } = authResult
  const db = getDatabase(this)
  
  try {
    // 权限检查
    const permissionResult = await checkTodoBookPermission(this, uid, bookId, PERMISSION_TYPE.READ)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    // 检查项目册是否存在
    const bookResult = await db.collection('todobooks').doc(bookId).get()
    if (!bookResult.data.length) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, '项目册不存在')
    }
    
    // 获取任务列表
    const tasksResult = await db.collection('todoitems')
      .where({ todobook_id: bookId })
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc')
      .get()
    
    // 更新最后访问时间
    await db.collection('todobook_members')
      .where({ todobook_id: bookId, user_id: uid })
      .update({ last_access_at: new Date() })
    
    return createSuccessResponse(tasksResult.data)
  } catch (error) {
    console.error('获取项目册任务列表失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取项目册任务列表失败')
  }
}

module.exports = getTodoBookTasks