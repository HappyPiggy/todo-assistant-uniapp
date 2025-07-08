// 删除评论

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkIsCreator } = require('../../lib/utils/permission')
const { ERROR_CODES } = require('../../common/constants')

/**
 * 删除评论（软删除）
 * @param {Object} params 参数对象
 * @param {string} params.commentId 评论ID
 * @returns {Object} 响应结果
 */
async function deleteTaskComment(params) {
  const { commentId } = params
  
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
    
    // 找到要删除的评论
    const commentIndex = comments.findIndex(c => c._id === commentId)
    if (commentIndex === -1 || comments[commentIndex].is_deleted) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, '评论不存在')
    }
    
    const comment = comments[commentIndex]
    
    // 检查权限：评论作者或项目册创建者可以删除
    let canDelete = false
    if (comment.user_id === uid) {
      canDelete = true
    } else {
      // 检查是否是项目册创建者
      const creatorCheckResult = await checkIsCreator(this, uid, task.todobook_id)
      if (creatorCheckResult.success && creatorCheckResult.isCreator) {
        canDelete = true
      }
    }
    
    if (!canDelete) {
      return createErrorResponse(ERROR_CODES.FORBIDDEN, '无权限删除此评论')
    }
    
    // 软删除评论
    comments[commentIndex].is_deleted = true
    comments[commentIndex].deleted_at = new Date()
    
    // 同时软删除该评论的所有回复
    comments.forEach((c, index) => {
      if (c.reply_to === commentId && !c.is_deleted) {
        comments[index].is_deleted = true
        comments[index].deleted_at = new Date()
      }
    })
    
    // 更新任务的评论数组
    await db.collection('todoitems')
      .doc(task._id)
      .update({
        comments: comments,
        updated_at: new Date()
      })
    
    return createSuccessResponse(null, '评论删除成功')
  } catch (error) {
    console.error('删除评论失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '删除评论失败')
  }
}

module.exports = deleteTaskComment