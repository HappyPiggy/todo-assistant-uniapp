// 获取任务评论列表

const { 
  createSuccessResponse, 
  createErrorResponse, 
  validatePaginationParams 
} = require('../../common/utils')
const { checkTaskPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 获取任务评论列表（分页）
 * @param {Object} params 参数对象
 * @param {string} params.taskId 任务ID
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页大小
 * @returns {Object} 响应结果
 */
async function getTaskComments(params) {
  const { taskId, page = 1, pageSize = 20 } = params
  
  const { uid, db } = this
  
  // 参数验证
  if (!taskId) {
    return createErrorResponse(ERROR_CODES.INVALID_PARAM, '任务ID不能为空')
  }
  
  const paginationParams = validatePaginationParams(page, pageSize)
  let { page: validPage, pageSize: validPageSize } = paginationParams
  validPageSize = Math.min(50, validPageSize) // 限制最大每页50条
  
  try {
    // 权限检查和获取任务信息
    const permissionResult = await checkTaskPermission(this, uid, taskId, PERMISSION_TYPE.READ)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    const { task } = permissionResult
    let comments = task.comments || []
    
    // 过滤已删除的评论
    const activeComments = comments.filter(comment => !comment.is_deleted)
    
    // 批量获取用户信息
    if (activeComments.length > 0) {
      const userIds = [...new Set(activeComments.map(comment => comment.user_id))]
      
      try {
        const usersResult = await db.collection('uni-id-users')
          .where({
            _id: db.command.in(userIds)
          })
          .field({
            _id: true,
            nickname: true,
            avatar_file: true,
            username: true,
            mobile: true,
            email: true
          })
          .get()
        
        // 创建用户信息映射
        const userMap = {}
        usersResult.data.forEach(user => {
          userMap[user._id] = user
        })
        
        // 为评论添加用户信息
        activeComments.forEach(comment => {
          // 检查是否为匿名用户ID
          if (comment.user_id && comment.user_id.startsWith('anonymous_user_')) {
            // 匿名用户处理
            const userLetter = comment.user_id.split('_')[2] // 提取字母部分
            comment.user_nickname = `用户${userLetter}`
            comment.user_avatar = '' // 匿名用户不显示头像
          } else {
            // 真实用户处理
            const user = userMap[comment.user_id]
            if (user) {
              // 优先级：昵称 > 用户名 > 手机号脱敏 > 邮箱前缀 > 默认值
              let displayName = '用户'
              if (user.nickname && user.nickname.trim()) {
                displayName = user.nickname.trim()
              } else if (user.username && user.username.trim()) {
                displayName = user.username.trim()
              } else if (user.mobile) {
                displayName = user.mobile.substring(0, 3) + '****' + user.mobile.substring(7)
              } else if (user.email) {
                displayName = user.email.split('@')[0]
              }
              
              comment.user_nickname = displayName
              comment.user_avatar = user.avatar_file || ''
            } else {
              comment.user_nickname = '用户'
              comment.user_avatar = ''
            }
          }
          
          // 确保有唯一ID
          if (!comment._id) {
            comment._id = comment.created_at.getTime().toString()
          }
        })
      } catch (error) {
        console.error('批量获取用户信息失败:', error)
        // 如果批量查询失败，设置默认值
        activeComments.forEach(comment => {
          comment.user_nickname = '用户'
          comment.user_avatar = ''
          if (!comment._id) {
            comment._id = comment.created_at.getTime().toString()
          }
        })
      }
    }
    
    // 分离顶级评论和回复
    const topLevelComments = activeComments.filter(c => !c.reply_to)
    const replies = activeComments.filter(c => c.reply_to)
    
    // 按时间倒序排列顶级评论（最新在前）
    topLevelComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    
    // 将回复添加到对应的顶级评论
    topLevelComments.forEach(comment => {
      comment.replies = replies
        .filter(reply => reply.reply_to === comment._id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // 回复按时间正序
    })
    
    // 分页处理
    const total = topLevelComments.length
    const startIndex = (validPage - 1) * validPageSize
    const endIndex = startIndex + validPageSize
    const paginatedComments = topLevelComments.slice(startIndex, endIndex)
    
    return createSuccessResponse({
      comments: paginatedComments,
      total: total,
      page: validPage,
      pageSize: validPageSize,
      hasMore: endIndex < total
    })
  } catch (error) {
    console.error('获取评论列表失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取评论列表失败')
  }
}

module.exports = getTaskComments