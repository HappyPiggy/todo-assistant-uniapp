// 退出项目册

const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkIsCreator } = require('../../lib/utils/permission')
const { updateTodoBookStats } = require('../../lib/utils/database')
const { ERROR_CODES } = require('../../common/constants')

/**
 * 退出项目册
 * @param {string} todobook_id 项目册ID
 * @returns {Object} 响应结果
 */
async function leaveBook(todobook_id) {
  const { uid, db } = this
  
  try {
    // 检查用户是否是项目册创建者
    const creatorCheckResult = await checkIsCreator(this, uid, todobook_id)
    if (!creatorCheckResult.success) {
      return creatorCheckResult.error
    }
    
    if (creatorCheckResult.isCreator) {
      return createErrorResponse(ERROR_CODES.INVALID_PARAM, '项目册创建者不能退出，请删除项目册或转让所有权')
    }
    
    // 检查用户是否是成员
    const memberResult = await db.collection('todobook_members')
      .where({
        todobook_id: todobook_id,
        user_id: uid,
        is_active: true
      })
      .get()
    
    if (memberResult.data.length === 0) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, '您不是该项目册的成员')
    }
    
    // 退出项目册（设为非活跃状态）
    await db.collection('todobook_members')
      .where({
        todobook_id: todobook_id,
        user_id: uid
      })
      .update({
        is_active: false,
        left_at: new Date()
      })
    
    // 更新项目册成员数量
    await updateTodoBookStats(this, todobook_id, {
      member_count: db.command.inc(-1)
    })
    
    return createSuccessResponse(null, '退出项目册成功')
  } catch (error) {
    console.error('退出项目册失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '退出项目册失败')
  }
}

module.exports = leaveBook