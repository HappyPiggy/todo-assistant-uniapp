// 评论未读状态管理工具函数

/**
 * 计算任务的未读评论数量
 * @param {string} taskId 任务ID
 * @param {Array} comments 评论数组
 * @param {string} currentUserId 当前用户ID
 * @returns {number} 未读评论数量
 */
export function calculateUnreadCount(taskId, comments, currentUserId) {
  if (!comments || comments.length === 0) {
    return 0
  }
  
  // 获取本地存储的已读记录
  const commentReadRecords = uni.getStorageSync('task_comment_read_records') || {}
  const taskReadRecords = commentReadRecords[taskId] || {}
  
  
  let unreadCount = 0
  
  // 遍历所有评论（包括回复）
  comments.forEach((comment, index) => {
    console.log(`[DEBUG] 处理评论 ${index + 1}:`, {
      commentId: comment._id,
      userId: comment.user_id,
      isOwnComment: comment.user_id === currentUserId,
      createdAt: comment.created_at,
      isDeleted: comment.is_deleted
    })
    
    // 不计算自己的评论
    if (comment.user_id === currentUserId) {
      console.log('[DEBUG] 跳过自己的评论')
      return
    }
    
    // 如果评论已删除，不计算
    if (comment.is_deleted) {
      console.log('[DEBUG] 跳过已删除的评论')
      return
    }
    
    // 检查是否已读
    const lastReadTime = taskReadRecords[comment._id] || 0
    const commentTime = new Date(comment.created_at).getTime()
    
    console.log(`[DEBUG] 评论时间对比:`, {
      commentTime,
      lastReadTime,
      isUnread: commentTime > lastReadTime
    })
    
    if (commentTime > lastReadTime) {
      unreadCount++
      console.log(`[DEBUG] 评论未读，计数+1，当前未读数:`, unreadCount)
    } else {
      console.log('[DEBUG] 评论已读，跳过')
    }
    
    // 处理回复
    if (comment.replies && comment.replies.length > 0) {
      console.log(`[DEBUG] 处理 ${comment.replies.length} 个回复`)
      comment.replies.forEach((reply, replyIndex) => {
        console.log(`[DEBUG] 处理回复 ${replyIndex + 1}:`, {
          replyId: reply._id,
          userId: reply.user_id,
          isOwnReply: reply.user_id === currentUserId,
          createdAt: reply.created_at,
          isDeleted: reply.is_deleted
        })
        
        // 不计算自己的回复
        if (reply.user_id === currentUserId) {
          console.log('[DEBUG] 跳过自己的回复')
          return
        }
        
        // 如果回复已删除，不计算
        if (reply.is_deleted) {
          console.log('[DEBUG] 跳过已删除的回复')
          return
        }
        
        // 检查回复是否已读
        const replyLastReadTime = taskReadRecords[reply._id] || 0
        const replyTime = new Date(reply.created_at).getTime()
        
        console.log(`[DEBUG] 回复时间对比:`, {
          replyTime,
          replyLastReadTime,
          isUnread: replyTime > replyLastReadTime
        })
        
        if (replyTime > replyLastReadTime) {
          unreadCount++
          console.log(`[DEBUG] 回复未读，计数+1，当前未读数:`, unreadCount)
        } else {
          console.log('[DEBUG] 回复已读，跳过')
        }
      })
    }
  })
  
  const finalCount = Math.min(unreadCount, 99) // 最多显示99+
  console.log('[DEBUG] calculateUnreadCount 结果:', { unreadCount, finalCount })
  
  return finalCount
}


/**
 * 标记任务的所有评论为已读
 * @param {string} taskId 任务ID
 * @param {Array} comments 评论数组
 */
export function markTaskCommentsAsRead(taskId, comments) {
  if (!comments || comments.length === 0) {
    return
  }
  
  const commentReadRecords = uni.getStorageSync('task_comment_read_records') || {}
  const currentTime = Date.now()
  
  if (!commentReadRecords[taskId]) {
    commentReadRecords[taskId] = {}
  }
  
  // 标记所有评论为已读
  comments.forEach(comment => {
    commentReadRecords[taskId][comment._id] = currentTime
    
    // 标记回复为已读
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => {
        commentReadRecords[taskId][reply._id] = currentTime
      })
    }
  })
  
  uni.setStorageSync('task_comment_read_records', commentReadRecords)
}

/**
 * 获取任务的已读记录
 * @param {string} taskId 任务ID
 * @returns {Object} 已读记录
 */
export function getTaskReadRecords(taskId) {
  const commentReadRecords = uni.getStorageSync('task_comment_read_records') || {}
  return commentReadRecords[taskId] || {}
}

/**
 * 清理过期的已读记录（可选功能）
 * @param {number} daysToKeep 保留天数，默认30天
 */
export function cleanupExpiredReadRecords(daysToKeep = 30) {
  const commentReadRecords = uni.getStorageSync('task_comment_read_records') || {}
  const currentTime = Date.now()
  const expireTime = daysToKeep * 24 * 60 * 60 * 1000
  
  let cleanedCount = 0
  
  Object.keys(commentReadRecords).forEach(taskId => {
    const taskRecords = commentReadRecords[taskId]
    const cleanedTaskRecords = {}
    
    Object.keys(taskRecords).forEach(commentId => {
      const readTime = taskRecords[commentId]
      if (currentTime - readTime < expireTime) {
        cleanedTaskRecords[commentId] = readTime
      } else {
        cleanedCount++
      }
    })
    
    if (Object.keys(cleanedTaskRecords).length > 0) {
      commentReadRecords[taskId] = cleanedTaskRecords
    } else {
      delete commentReadRecords[taskId]
    }
  })
  
  uni.setStorageSync('task_comment_read_records', commentReadRecords)
}

/**
 * 批量标记评论ID列表为已读
 * @param {string} taskId 任务ID
 * @param {Array} commentIds 评论ID数组
 */
export function markCommentIdsAsRead(taskId, commentIds) {
  if (!commentIds || commentIds.length === 0) {
    return
  }
  
  const commentReadRecords = uni.getStorageSync('task_comment_read_records') || {}
  const currentTime = Date.now()
  
  if (!commentReadRecords[taskId]) {
    commentReadRecords[taskId] = {}
  }
  
  // 批量标记评论ID为已读
  commentIds.forEach(commentId => {
    commentReadRecords[taskId][commentId] = currentTime
  })
  
  uni.setStorageSync('task_comment_read_records', commentReadRecords)
  
  console.log('批量标记评论为已读:', taskId, '评论数量:', commentIds.length)
}

/**
 * 从任务评论数据中提取所有评论ID
 * @param {Array} comments 评论数组
 * @returns {Array} 评论ID数组
 */
export function extractCommentIds(comments) {
  if (!comments || comments.length === 0) {
    return []
  }
  
  const commentIds = []
  
  comments.forEach(comment => {
    // 添加主评论ID
    commentIds.push(comment._id)
    
    // 添加回复评论ID
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => {
        commentIds.push(reply._id)
      })
    }
  })
  
  return commentIds
}

/**
 * 获取本地存储的统计信息
 * @returns {Object} 统计信息
 */
export function getReadRecordsStats() {
  const commentReadRecords = uni.getStorageSync('task_comment_read_records') || {}
  
  let totalTasks = 0
  let totalComments = 0
  
  Object.keys(commentReadRecords).forEach(taskId => {
    totalTasks++
    totalComments += Object.keys(commentReadRecords[taskId]).length
  })
  
  return {
    totalTasks,
    totalComments,
    storageSize: JSON.stringify(commentReadRecords).length
  }
}