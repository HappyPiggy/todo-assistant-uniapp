// 编辑评论

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { 
  createSuccessResponse, 
  createErrorResponse, 
  validateStringParam 
} = require('../../common/utils')
const { ERROR_CODES } = require('../../common/constants')

/**
 * 编辑评论
 * @param {Object} params 参数对象
 * @param {string} params.commentId 评论ID
 * @param {string} params.content 评论内容
 * @returns {Object} 响应结果
 */
async function updateTaskComment(params) {
  const { commentId, content } = params
  
  // 认证验证
  const authResult = await validateAuth(this)
  if (!authResult.success) {
    return authResult.error
  }
  
  const { uid } = authResult
  const db = getDatabase(this)
  
  // 参数验证
  if (!commentId) {
    return createErrorResponse(ERROR_CODES.INVALID_PARAM, '评论ID不能为空')
  }
  
  const contentValidation = validateStringParam(content, '评论内容', 1, 1000)
  if (contentValidation) {
    return contentValidation
  }
  
  try {
    // 从 commentId 中提取 taskId（commentId 格式：taskId_timestamp_random）
    const taskId = commentId.split('_')[0]
    if (!taskId) {
      return createErrorResponse(ERROR_CODES.INVALID_PARAM, '评论ID格式错误')
    }
    
    // 根据 taskId 查找任务
    const taskResult = await db.collection('todoitems')
      .doc(taskId)
      .get()
    
    if (taskResult.data.length === 0) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, '任务不存在')
    }
    
    const task = taskResult.data[0]
    let comments = task.comments || []
    
    // 找到要编辑的评论
    const commentIndex = comments.findIndex(c => c._id === commentId)
    if (commentIndex === -1 || comments[commentIndex].is_deleted) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, '评论不存在')
    }
    
    const comment = comments[commentIndex]
    
    // 检查权限：只有评论作者可以编辑
    if (comment.user_id !== uid) {
      return createErrorResponse(ERROR_CODES.FORBIDDEN, '无权限编辑此评论')
    }
    
    // 更新评论内容
    comments[commentIndex].content = content.trim()
    comments[commentIndex].updated_at = new Date()
    
    // 更新任务的评论数组
    await db.collection('todoitems')
      .doc(task._id)
      .update({
        comments: comments,
        updated_at: new Date()
      })
    
    return createSuccessResponse({
      comment: comments[commentIndex]
    }, '评论编辑成功')
  } catch (error) {
    console.error('编辑评论失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '编辑评论失败')
  }
}

module.exports = updateTaskComment