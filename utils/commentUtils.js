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
    // 处理主评论：如果不是自己的且未删除，则检查是否已读
    if (comment.user_id !== currentUserId && !comment.is_deleted) {
      const lastReadTime = taskReadRecords[comment._id] || 0
      const commentTime = new Date(comment.created_at).getTime()
      
      if (commentTime > lastReadTime) {
        unreadCount++
      }
    }
    
    // 处理回复：无论主评论是否是自己的，都要检查回复
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach((reply, replyIndex) => {
        // 不计算自己的回复或已删除的回复
        if (reply.user_id === currentUserId || reply.is_deleted) {
          return
        }
        
        // 检查回复是否已读
        const replyLastReadTime = taskReadRecords[reply._id] || 0
        const replyTime = new Date(reply.created_at).getTime()
        
        if (replyTime > replyLastReadTime) {
          unreadCount++
        }
      })
    }
  })
  
  const finalCount = Math.min(unreadCount, 99) // 最多显示99+
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

/**
 * 统一的任务评论计数函数
 * 确保所有场景下都使用相同的计算逻辑，包含所有回复
 * @param {Object} task 任务对象
 * @param {boolean} includeReplies 是否包含回复，默认true
 * @returns {number} 评论总数
 */
export function getTaskCommentCount(task, includeReplies = true) {
  try {
    if (!task || !task.comments || !Array.isArray(task.comments)) {
      return 0
    }
    
    if (!includeReplies) {
      // 只计算主评论数量
      return task.comments.filter(comment => !comment.is_deleted).length
    }
    
    // 计算包含回复的总评论数
    let totalCount = 0
    
    task.comments.forEach(comment => {
      // 计算主评论（非删除的）
      if (!comment.is_deleted) {
        totalCount++
      }
      
      // 计算回复数量（非删除的）
      if (comment.replies && Array.isArray(comment.replies)) {
        totalCount += comment.replies.filter(reply => !reply.is_deleted).length
      }
    })
    
    return totalCount
    
  } catch (error) {
    console.error('计算评论总数失败:', error)
    return 0
  }
}