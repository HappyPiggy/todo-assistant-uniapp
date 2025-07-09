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
  comments.forEach(comment => {
    // 不计算自己的评论
    if (comment.user_id === currentUserId) {
      return
    }
    
    // 如果评论已删除，不计算
    if (comment.is_deleted) {
      return
    }
    
    // 检查是否已读
    const lastReadTime = taskReadRecords[comment._id] || 0
    const commentTime = new Date(comment.created_at).getTime()
    
    if (commentTime > lastReadTime) {
      unreadCount++
    }
    
    // 处理回复
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => {
        // 不计算自己的回复
        if (reply.user_id === currentUserId) {
          return
        }
        
        // 如果回复已删除，不计算
        if (reply.is_deleted) {
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
  
  return Math.min(unreadCount, 99) // 最多显示99+
}

/**
 * 计算项目册的未读评论数量
 * @param {string} todoBookId 项目册ID
 * @param {Array} tasks 任务数组
 * @param {string} currentUserId 当前用户ID
 * @returns {number} 未读评论数量
 */
export function calculateBookUnreadCount(todoBookId, tasks, currentUserId) {
  if (!tasks || tasks.length === 0) {
    return 0
  }
  
  let totalUnreadCount = 0
  
  tasks.forEach(task => {
    if (task.comments && task.comments.length > 0) {
      const taskUnreadCount = calculateUnreadCount(task._id, task.comments, currentUserId)
      totalUnreadCount += taskUnreadCount
    }
  })
  
  return Math.min(totalUnreadCount, 99) // 最多显示99+
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