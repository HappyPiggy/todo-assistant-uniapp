// 添加任务评论

const { 
  createSuccessResponse, 
  createErrorResponse, 
  validateStringParam 
} = require('../../common/utils')
const { checkTaskPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 添加任务评论
 * @param {string} taskId 任务ID
 * @param {string} content 评论内容
 * @param {string} parentCommentId 父评论ID（回复时使用）
 * @returns {Object} 响应结果
 */
async function addTaskComment(taskId, content, parentCommentId = null) {
  
  const { uid, db } = this
  
  // 参数验证
  if (!taskId) {
    return createErrorResponse(ERROR_CODES.INVALID_PARAM, '任务ID不能为空')
  }
  
  const contentValidation = validateStringParam(content, '评论内容', 1, 1000)
  if (contentValidation) {
    return contentValidation
  }
  
  try {
    // 权限检查和获取任务信息
    const permissionResult = await checkTaskPermission(this, uid, taskId, PERMISSION_TYPE.WRITE)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    const { task } = permissionResult
    let comments = task.comments || []
    
    // 验证父评论是否存在（如果是回复）
    if (parentCommentId) {
      const parentComment = comments.find(c => 
        c._id === parentCommentId && 
        !c.is_deleted && 
        !c.reply_to // 只能回复顶级评论
      )
      
      if (!parentComment) {
        return createErrorResponse(ERROR_CODES.INVALID_PARAM, '父评论不存在或不允许回复')
      }
    }
    
    // 获取用户信息
    const userResult = await db.collection('uni-id-users')
      .where({ _id: uid })
      .field({
        nickname: true,
        avatar_file: true,
        username: true,
        mobile: true,
        email: true
      })
      .get()
    
    const user = userResult.data.length > 0 ? userResult.data[0] : {}
    
    // 创建新评论
    const now = new Date()
    const commentId = `${taskId}_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newComment = {
      _id: commentId,
      user_id: uid,
      content: content.trim(),
      created_at: now,
      is_deleted: false
    }
    
    if (parentCommentId) {
      newComment.reply_to = parentCommentId
    }
    
    // 添加评论到数组
    comments.push(newComment)
    
    // 更新任务的评论数组
    await db.collection('todoitems')
      .doc(taskId)
      .update({
        comments: comments,
        updated_at: now
      })
    
    // 为返回的评论添加用户信息
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
    
    newComment.user_nickname = displayName
    newComment.user_avatar = user.avatar_file || ''
    
    return createSuccessResponse({
      commentId: commentId,
      comment: newComment
    }, '评论添加成功')
  } catch (error) {
    console.error('添加评论失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '添加评论失败')
  }
}

module.exports = addTaskComment