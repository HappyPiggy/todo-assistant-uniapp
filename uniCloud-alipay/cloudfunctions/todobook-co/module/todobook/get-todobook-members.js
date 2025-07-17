// 获取项目册成员列表

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkTodoBookPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 获取项目册成员列表
 * @param {string} bookId 项目册ID
 * @returns {Object} 响应结果
 * 
 * 成功响应格式：
 * {
 *   success: true,
 *   data: [
 *     {
 *       user_id: "用户ID",
 *       todobook_id: "项目册ID",
 *       role: "角色 (owner/admin/member)",
 *       is_active: "是否活跃",
 *       joined_at: "加入时间",
 *       last_access_at: "最后访问时间"
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
async function getTodoBookMembers(bookId) {
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
    
    // 获取成员列表
    const membersResult = await db.collection('todobook_members')
      .where({ todobook_id: bookId, is_active: true })
      .get()
    
    // 更新最后访问时间
    await db.collection('todobook_members')
      .where({ todobook_id: bookId, user_id: uid })
      .update({ last_access_at: new Date() })
    
    return createSuccessResponse(membersResult.data)
  } catch (error) {
    console.error('获取项目册成员列表失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取项目册成员列表失败')
  }
}

module.exports = getTodoBookMembers