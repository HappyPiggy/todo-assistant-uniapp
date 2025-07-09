// 删除项目册

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkTodoBookPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 删除项目册
 * @param {string} bookId 项目册ID
 * @returns {Object} 响应结果
 */
async function deleteTodoBook(bookId) {
  // 认证验证
  const authResult = await validateAuth(this)
  if (!authResult.success) {
    return authResult.error
  }
  
  const { uid } = authResult
  const db = getDatabase(this)
  
  try {
    // 权限检查
    const permissionResult = await checkTodoBookPermission(this, uid, bookId, PERMISSION_TYPE.DELETE)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    // 删除相关数据
    await Promise.all([
      // 删除项目册
      db.collection('todobooks').doc(bookId).remove(),
      // 删除成员关系
      db.collection('todobook_members').where({ todobook_id: bookId }).remove(),
      // 删除任务
      db.collection('todoitems').where({ todobook_id: bookId }).remove()
    ])
    
    return createSuccessResponse(null, '删除项目册成功')
  } catch (error) {
    console.error('删除项目册失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '删除项目册失败')
  }
}

module.exports = deleteTodoBook