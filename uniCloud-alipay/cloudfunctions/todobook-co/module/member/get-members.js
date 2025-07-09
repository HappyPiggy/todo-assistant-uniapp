// 获取成员列表

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { createSuccessResponse, createErrorResponse, handleAggregateWithFallback } = require('../../common/utils')
const { checkTodoBookPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 获取项目册成员列表
 * @param {string} todobook_id 项目册ID
 * @returns {Object} 响应结果
 */
async function getMembers(todobook_id) {
  // 认证验证
  const authResult = await validateAuth(this)
  if (!authResult.success) {
    return authResult.error
  }
  
  const { uid } = authResult
  const db = getDatabase(this)
  
  try {
    // 权限检查
    const permissionResult = await checkTodoBookPermission(this, uid, todobook_id, PERMISSION_TYPE.READ)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    // 获取成员列表和用户信息
    const memberResult = await handleAggregateWithFallback(
      // 聚合查询
      async () => {
        const result = await db.collection('todobook_members')
          .aggregate()
          .match({
            todobook_id: todobook_id,
            is_active: true
          })
          .lookup({
            from: 'uni-id-users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_info'
          })
          .unwind('$user_info')
          .project({
            user_id: 1,
            role: 1,
            permissions: 1,
            joined_at: 1,
            last_access_at: 1,
            invited_by: 1,
            'user_info.nickname': 1,
            'user_info.avatar_file': 1
          })
          .sort({ joined_at: 1 })
          .end()
        
        return {
          success: true,
          data: { members: result.data }
        }
      },
      // 备用查询
      async () => {
        // 先获取成员列表
        const members = await db.collection('todobook_members')
          .where({
            todobook_id: todobook_id,
            is_active: true
          })
          .orderBy('joined_at', 'asc')
          .get()
        
        // 获取所有用户ID
        const userIds = members.data.map(m => m.user_id)
        
        // 批量获取用户信息
        const users = await db.collection('uni-id-users')
          .where({
            _id: db.command.in(userIds)
          })
          .field({
            _id: true,
            nickname: true,
            avatar_file: true
          })
          .get()
        
        // 创建用户信息映射
        const userMap = {}
        users.data.forEach(user => {
          userMap[user._id] = user
        })
        
        // 合并数据
        const membersWithUserInfo = members.data.map(member => {
          const userInfo = userMap[member.user_id] || {
            nickname: '未知用户',
            avatar_file: null
          }
          return {
            ...member,
            user_info: userInfo
          }
        })
        
        return {
          success: true,
          data: { members: membersWithUserInfo }
        }
      }
    )
    
    if (!memberResult.success) {
      throw new Error('获取成员列表失败')
    }
    
    return createSuccessResponse(memberResult.data)
  } catch (error) {
    console.error('获取成员列表失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取成员列表失败')
  }
}

module.exports = getMembers