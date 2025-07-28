// 删除评论

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
  
  const { uid, db } = this
  
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
    
    console.log(`🔍 [删除评论调试] 开始权限检查`)
    console.log(`🔍 [删除评论调试] 评论ID: ${commentId}`)
    console.log(`🔍 [删除评论调试] 当前用户ID: ${uid}`)
    console.log(`🔍 [删除评论调试] 评论用户ID: ${comment.user_id}`)
    console.log(`🔍 [删除评论调试] 任务ID: ${taskId}`)
    console.log(`🔍 [删除评论调试] 项目册ID: ${task.todobook_id}`)
    // 检查项目册是否为导入项目册
    const bookResult = await db.collection('todobooks').doc(task.todobook_id).get()
    const todobook = bookResult.data.length > 0 ? bookResult.data[0] : null
    const isImportedBook = todobook && todobook.imported_from_share_id
    
    console.log(`🔍 [删除评论调试] 项目册是否为导入: ${isImportedBook ? '是' : '否'}`)
    if (isImportedBook) {
      console.log(`🔍 [删除评论调试] 导入来源分享ID: ${todobook.imported_from_share_id}`)
    }
    console.log(`🔍 [删除评论调试] 评论用户ID是否为匿名: ${comment.user_id && comment.user_id.startsWith('anonymous_user_') ? '是' : '否'}`)
    
    // 检查权限：评论作者或项目册创建者可以删除
    let canDelete = false
    
    // 如果是匿名用户的评论，只有项目册创建者可以删除
    if (comment.user_id && comment.user_id.startsWith('anonymous_user_')) {
      console.log(`🔍 [删除评论调试] 检测到匿名用户评论，检查项目册创建者权限`)
      // 检查是否是项目册创建者
      const creatorCheckResult = await checkIsCreator(this, uid, task.todobook_id)
      console.log(`🔍 [删除评论调试] 创建者检查结果:`, JSON.stringify(creatorCheckResult, null, 2))
      if (creatorCheckResult.success && creatorCheckResult.isCreator) {
        console.log(`🔍 [删除评论调试] 用户是项目册创建者，允许删除`)
        canDelete = true
      } else {
        console.log(`🔍 [删除评论调试] 用户不是项目册创建者，拒绝删除`)
      }
    } else if (comment.user_id === uid) {
      console.log(`🔍 [删除评论调试] 用户是评论作者，允许删除`)
      canDelete = true
    } else {
      console.log(`🔍 [删除评论调试] 用户不是评论作者，检查项目册创建者权限`)
      // 检查是否是项目册创建者
      const creatorCheckResult = await checkIsCreator(this, uid, task.todobook_id)
      console.log(`🔍 [删除评论调试] 创建者检查结果:`, JSON.stringify(creatorCheckResult, null, 2))
      if (creatorCheckResult.success && creatorCheckResult.isCreator) {
        console.log(`🔍 [删除评论调试] 用户是项目册创建者，允许删除`)
        canDelete = true
      } else {
        console.log(`🔍 [删除评论调试] 用户不是项目册创建者，拒绝删除`)
      }
    }
    
    console.log(`🔍 [删除评论调试] 最终权限检查结果: ${canDelete}`)
    
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