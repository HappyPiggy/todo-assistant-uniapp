// 获取项目册详情

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkTodoBookPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 获取项目册详情
 * @param {string} bookId 项目册ID
 * @returns {Object} 响应结果
 * 
 * 成功响应格式：
 * {
 *   success: true,
 *   data: {
 *     book: {
 *       id: "项目册ID",
 *       name: "项目册名称",
 *       description: "项目册描述",
 *       created_at: "创建时间",
 *       updated_at: "更新时间",
 *       creator_id: "创建者ID",
 *       is_archived: "是否归档",
 *       sort_order: "排序号"
 *     },
 *     members: [
 *       {
 *         user_id: "用户ID",
 *         todobook_id: "项目册ID",
 *         role: "角色 (owner/admin/member)",
 *         is_active: "是否活跃",
 *         joined_at: "加入时间",
 *         last_access_at: "最后访问时间"
 *       }
 *     ],
 *     tasks: [
 *       {
 *         id: "任务ID",
 *         todobook_id: "项目册ID",
 *         title: "任务标题",
 *         description: "任务描述",
 *         status: "任务状态 (todo/in_progress/completed)",
 *         priority: "优先级 (low/medium/high/urgent)",
 *         sort_order: "排序号",
 *         created_at: "创建时间",
 *         updated_at: "更新时间",
 *         creator_id: "创建者ID",
 *         assignee_id: "指派人ID",
 *         due_date: "截止日期",
 *         completed_at: "完成时间"
 *       }
 *     ]
 *   }
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
 */
async function getTodoBookDetail(bookId) {
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
    
    // 并行获取项目册信息、成员列表和任务列表
    const [bookDetailResult, membersResult, tasksResult] = await Promise.all([
      // 获取项目册信息
      db.collection('todobooks').doc(bookId).get(),
      
      // 获取成员列表
      db.collection('todobook_members')
        .where({ todobook_id: bookId, is_active: true })
        .get(),
      
      // 获取任务列表
      db.collection('todoitems')
        .where({ todobook_id: bookId })
        .orderBy('sort_order', 'asc')
        .orderBy('created_at', 'desc')
        .get()
    ])
    
    if (!bookDetailResult.data.length) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, '项目册不存在')
    }
    
    // 更新最后访问时间
    await db.collection('todobook_members')
      .where({ todobook_id: bookId, user_id: uid })
      .update({ last_access_at: new Date() })
    
    return createSuccessResponse({
      book: bookDetailResult.data[0],
      members: membersResult.data,
      tasks: tasksResult.data
    })
  } catch (error) {
    console.error('获取项目册详情失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取项目册详情失败')
  }
}

module.exports = getTodoBookDetail