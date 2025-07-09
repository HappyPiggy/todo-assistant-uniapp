// 测试评论已读状态的工具函数

import { calculateUnreadCount, markTaskCommentsAsRead, getReadRecordsStats } from './commentUtils.js'

/**
 * 测试多用户已读状态隔离
 * @param {string} taskId 任务ID
 * @param {Array} comments 评论数组
 * @param {Array} userIds 用户ID数组
 */
export function testMultiUserReadStatus(taskId, comments, userIds) {
  console.log('=== 测试多用户已读状态隔离 ===')
  console.log('任务ID:', taskId)
  console.log('评论数量:', comments.length)
  console.log('测试用户:', userIds)
  
  // 清空已读记录
  uni.removeStorageSync('task_comment_read_records')
  
  // 为每个用户计算未读数量
  userIds.forEach(userId => {
    console.log(`\n--- 用户 ${userId} ---`)
    const unreadCount = calculateUnreadCount(taskId, comments, userId)
    console.log('未读数量:', unreadCount)
    
    // 模拟不同用户的评论创建（自己的评论不计算为未读）
    const userComments = comments.filter(comment => comment.user_id !== userId)
    console.log('非本人评论数量:', userComments.length)
  })
  
  // 模拟用户A标记已读
  const userA = userIds[0]
  console.log(`\n--- 用户 ${userA} 标记已读 ---`)
  markTaskCommentsAsRead(taskId, comments)
  
  // 再次计算各用户的未读数量
  userIds.forEach(userId => {
    console.log(`\n--- 用户 ${userId} (标记后) ---`)
    const unreadCount = calculateUnreadCount(taskId, comments, userId)
    console.log('未读数量:', unreadCount)
  })
  
  // 显示存储统计
  console.log('\n--- 存储统计 ---')
  const stats = getReadRecordsStats()
  console.log('统计信息:', stats)
  
  // 显示存储内容
  const records = uni.getStorageSync('task_comment_read_records')
  console.log('存储内容:', records)
}

/**
 * 测试评论时间戳比较
 * @param {string} taskId 任务ID
 * @param {Array} comments 评论数组
 * @param {string} userId 用户ID
 */
export function testCommentTimestamp(taskId, comments, userId) {
  console.log('=== 测试评论时间戳比较 ===')
  console.log('任务ID:', taskId)
  console.log('用户ID:', userId)
  
  // 清空已读记录
  uni.removeStorageSync('task_comment_read_records')
  
  // 计算初始未读数量
  const initialUnread = calculateUnreadCount(taskId, comments, userId)
  console.log('初始未读数量:', initialUnread)
  
  // 模拟部分评论已读（设置过去的时间）
  const pastTime = Date.now() - 3600 * 1000 // 1小时前
  const commentReadRecords = {}
  commentReadRecords[taskId] = {}
  
  // 标记前一半评论为1小时前已读
  const halfIndex = Math.floor(comments.length / 2)
  comments.slice(0, halfIndex).forEach(comment => {
    commentReadRecords[taskId][comment._id] = pastTime
  })
  
  uni.setStorageSync('task_comment_read_records', commentReadRecords)
  
  // 重新计算未读数量
  const partialUnread = calculateUnreadCount(taskId, comments, userId)
  console.log('部分已读后未读数量:', partialUnread)
  
  // 显示详细的时间比较
  console.log('\n--- 时间比较详情 ---')
  comments.forEach((comment, index) => {
    const commentTime = new Date(comment.created_at).getTime()
    const readTime = commentReadRecords[taskId][comment._id] || 0
    const isUnread = commentTime > readTime && comment.user_id !== userId
    
    console.log(`评论 ${index + 1}:`, {
      content: comment.content?.substring(0, 30) + '...',
      createdAt: new Date(comment.created_at).toLocaleString(),
      readTime: readTime ? new Date(readTime).toLocaleString() : '未读',
      isUnread
    })
  })
}

/**
 * 测试工具函数性能
 * @param {string} taskId 任务ID
 * @param {Array} comments 评论数组
 * @param {string} userId 用户ID
 * @param {number} iterations 测试次数
 */
export function testPerformance(taskId, comments, userId, iterations = 1000) {
  console.log('=== 测试性能 ===')
  console.log('任务ID:', taskId)
  console.log('评论数量:', comments.length)
  console.log('测试次数:', iterations)
  
  const startTime = Date.now()
  
  for (let i = 0; i < iterations; i++) {
    calculateUnreadCount(taskId, comments, userId)
  }
  
  const endTime = Date.now()
  const avgTime = (endTime - startTime) / iterations
  
  console.log('总耗时:', endTime - startTime, 'ms')
  console.log('平均耗时:', avgTime.toFixed(2), 'ms')
  console.log('每秒处理:', Math.round(1000 / avgTime), '次')
}

/**
 * 生成测试数据
 * @param {number} commentCount 评论数量
 * @param {Array} userIds 用户ID数组
 * @returns {Array} 测试评论数组
 */
export function generateTestComments(commentCount, userIds) {
  const comments = []
  const now = Date.now()
  
  for (let i = 0; i < commentCount; i++) {
    const userId = userIds[i % userIds.length]
    const createdAt = new Date(now - (commentCount - i) * 60000) // 每分钟一条评论
    
    comments.push({
      _id: `comment_${i + 1}`,
      content: `这是第${i + 1}条测试评论`,
      user_id: userId,
      created_at: createdAt,
      is_deleted: false,
      replies: []
    })
  }
  
  return comments
}

/**
 * 运行完整测试套件
 * @param {string} taskId 任务ID
 */
export function runTestSuite(taskId) {
  console.log('=== 运行完整测试套件 ===')
  
  const userIds = ['user1', 'user2', 'user3']
  const comments = generateTestComments(20, userIds)
  
  // 测试多用户隔离
  testMultiUserReadStatus(taskId, comments, userIds)
  
  // 测试时间戳比较
  testCommentTimestamp(taskId, comments, userIds[0])
  
  // 测试性能
  testPerformance(taskId, comments, userIds[0], 100)
  
  console.log('=== 测试完成 ===')
}