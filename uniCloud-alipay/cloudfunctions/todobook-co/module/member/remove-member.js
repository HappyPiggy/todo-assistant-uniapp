// 移除成员

const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkTodoBookPermission, checkIsCreator } = require('../../lib/utils/permission')
const { updateTodoBookStats } = require('../../lib/utils/database')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 移除项目册成员
 * @param {string} todobook_id 项目册ID
 * @param {string} member_user_id 要移除的用户ID
 * @returns {Object} 响应结果
 */
async function removeMember(todobook_id, member_user_id) {
  const { uid, db } = this
  
  try {
    // 权限检查
    const permissionResult = await checkTodoBookPermission(this, uid, todobook_id, PERMISSION_TYPE.MANAGE_MEMBERS)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    // 检查要移除的用户是否是项目册创建者
    const creatorCheckResult = await checkIsCreator(this, member_user_id, todobook_id)
    if (!creatorCheckResult.success) {
      return creatorCheckResult.error
    }
    
    if (creatorCheckResult.isCreator) {
      return createErrorResponse(ERROR_CODES.INVALID_PARAM, '不能移除项目册创建者')
    }
    
    // 检查要移除的用户是否是成员
    const memberResult = await db.collection('todobook_members')
      .where({
        todobook_id: todobook_id,
        user_id: member_user_id,
        is_active: true
      })
      .get()
    
    if (memberResult.data.length === 0) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, '该用户不是项目册成员')
    }
    
    // 移除成员（设为非活跃状态）
    await db.collection('todobook_members')
      .where({
        todobook_id: todobook_id,
        user_id: member_user_id
      })
      .update({
        is_active: false,
        removed_at: new Date()
      })
    
    // 更新项目册成员数量
    await updateTodoBookStats(this, todobook_id, {
      member_count: db.command.inc(-1)
    })
    
    return createSuccessResponse(null, '移除成员成功')
  } catch (error) {
    console.error('移除成员失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '移除成员失败')
  }
}

module.exports = removeMember