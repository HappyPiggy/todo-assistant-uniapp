// 邀请成员

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { 
  createSuccessResponse, 
  createErrorResponse, 
  validateStringParam 
} = require('../../common/utils')
const { checkTodoBookPermission } = require('../../lib/utils/permission')
const { updateTodoBookStats } = require('../../lib/utils/database')
const { ERROR_CODES, PERMISSION_TYPE, MEMBER_ROLE } = require('../../common/constants')

/**
 * 邀请用户加入项目册（基于昵称）
 * @param {string} todobook_id 项目册ID
 * @param {string} nickname 用户昵称
 * @returns {Object} 响应结果
 */
async function inviteUserByNickname(todobook_id, nickname) {
  // 认证验证
  const authResult = await validateAuth(this)
  if (!authResult.success) {
    return authResult.error
  }
  
  const { uid } = authResult
  const db = getDatabase(this)
  
  // 验证昵称参数
  const nicknameValidation = validateStringParam(nickname, '用户昵称')
  if (nicknameValidation) {
    return nicknameValidation
  }
  
  try {
    // 权限检查
    const permissionResult = await checkTodoBookPermission(this, uid, todobook_id, PERMISSION_TYPE.MANAGE_MEMBERS)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    const trimmedNickname = nickname.trim()
    
    // 查找要邀请的用户
    const userResult = await db.collection('uni-id-users')
      .where({ nickname: trimmedNickname })
      .field({ _id: true, nickname: true })
      .get()
    
    if (userResult.data.length === 0) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, '未找到该昵称的用户')
    }
    
    const inviteeId = userResult.data[0]._id
    
    // 检查邀请者是否尝试邀请自己
    if (inviteeId === uid) {
      return createErrorResponse(ERROR_CODES.INVALID_PARAM, '不能邀请自己')
    }
    
    // 检查用户是否已经是成员
    const memberCheck = await db.collection('todobook_members')
      .where({
        todobook_id: todobook_id,
        user_id: inviteeId,
        is_active: true
      })
      .count()
    
    if (memberCheck.total > 0) {
      return createErrorResponse(ERROR_CODES.INVALID_PARAM, '该用户已经是项目册成员')
    }
    
    const now = new Date()
    
    // 添加新成员
    await db.collection('todobook_members').add({
      todobook_id: todobook_id,
      user_id: inviteeId,
      role: MEMBER_ROLE.MEMBER,
      permissions: [PERMISSION_TYPE.READ, PERMISSION_TYPE.WRITE],
      invited_by: uid,
      joined_at: now,
      last_access_at: now,
      is_active: true
    })
    
    // 更新项目册成员数量
    await updateTodoBookStats(this, todobook_id, {
      member_count: db.command.inc(1)
    })
    
    return createSuccessResponse({
      invitee_nickname: trimmedNickname,
      invitee_id: inviteeId
    }, '邀请用户成功')
  } catch (error) {
    console.error('邀请用户失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '邀请用户失败')
  }
}

module.exports = inviteUserByNickname