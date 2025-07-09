// 数据库操作工具函数

const { ERROR_CODES } = require('../../common/constants')
const { createErrorResponse } = require('../../common/utils')
const { getDatabase } = require('./auth')

/**
 * 更新项目册统计数据
 * @param {Object} context 云函数上下文
 * @param {string} todoBookId 项目册ID
 * @param {Object} updates 更新数据
 * @returns {Object} 更新结果 { success: boolean, error?: Object }
 */
async function updateTodoBookStats(context, todoBookId, updates = {}) {
  const db = getDatabase(context)
  
  try {
    const updateData = {
      ...updates,
      last_activity_at: new Date()
    }
    
    await db.collection('todobooks')
      .doc(todoBookId)
      .update(updateData)
    
    return { success: true }
  } catch (error) {
    console.error('更新项目册统计失败:', error)
    return {
      success: false,
      error: createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '更新项目册统计失败')
    }
  }
}

/**
 * 获取项目册任务统计
 * @param {Object} context 云函数上下文
 * @param {string} todoBookId 项目册ID
 * @returns {Object} 统计结果 { success: boolean, stats?: Object, error?: Object }
 */
async function getTodoBookTaskStats(context, todoBookId) {
  const db = getDatabase(context)
  
  try {
    const taskStatsResult = await db.collection('todoitems')
      .aggregate()
      .match({ todobook_id: todoBookId })
      .group({
        _id: '$status',
        count: db.command.aggregate.sum(1)
      })
      .end()
    
    const taskStats = {
      total: 0,
      todo: 0,
      in_progress: 0,
      completed: 0
    }
    
    if (taskStatsResult.data) {
      taskStatsResult.data.forEach(stat => {
        taskStats[stat._id] = stat.count
        taskStats.total += stat.count
      })
    }
    
    return {
      success: true,
      stats: taskStats
    }
  } catch (error) {
    console.error('获取任务统计失败:', error)
    return {
      success: false,
      error: createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取任务统计失败')
    }
  }
}

/**
 * 获取项目册成员数量
 * @param {Object} context 云函数上下文
 * @param {string} todoBookId 项目册ID
 * @returns {Object} 成员数量结果 { success: boolean, count?: number, error?: Object }
 */
async function getTodoBookMemberCount(context, todoBookId) {
  const db = getDatabase(context)
  
  try {
    const memberResult = await db.collection('todobook_members')
      .where({ todobook_id: todoBookId, is_active: true })
      .count()
    
    return {
      success: true,
      count: memberResult.total
    }
  } catch (error) {
    console.error('获取成员数量失败:', error)
    return {
      success: false,
      error: createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取成员数量失败')
    }
  }
}

/**
 * 获取项目册未读评论数量
 * @param {Object} context 云函数上下文
 * @param {string} todoBookId 项目册ID
 * @param {string} userId 用户ID
 * @param {Object} lastViewTimes 本地存储的任务查看时间
 * @returns {Object} 未读评论数量结果 { success: boolean, count?: number, error?: Object }
 */
async function getTodoBookUnreadCommentCount(context, todoBookId, userId, lastViewTimes = {}) {
  const db = getDatabase(context)
  
  console.log('[Cloud] 计算项目册未读评论数量:', {
    todoBookId,
    userId,
    lastViewTimesCount: Object.keys(lastViewTimes).length
  })
  
  try {
    // 获取项目册下所有任务
    const tasksResult = await db.collection('todoitems')
      .where({ todobook_id: todoBookId })
      .field({ _id: true, comments: true, title: true })
      .get()
    
    console.log(`[Cloud] 项目册 ${todoBookId} 包含 ${tasksResult.data?.length || 0} 个任务`)
    
    if (!tasksResult.data || tasksResult.data.length === 0) {
      return { success: true, count: 0 }
    }
    
    let unreadCount = 0
    
    for (const task of tasksResult.data) {
      if (!task.comments || task.comments.length === 0) {
        console.log(`[Cloud] 任务 ${task.title} 没有评论`)
        continue
      }
      
      // 获取该任务的最后查看时间
      const lastViewTime = lastViewTimes[task._id] || 0
      
      console.log(`[Cloud] 任务 ${task.title}:`, {
        taskId: task._id,
        commentsCount: task.comments.length,
        lastViewTime: new Date(lastViewTime).toLocaleString()
      })
      
      // 统计该任务中未读的评论数量
      const unreadComments = task.comments.filter(comment => {
        // 不计算自己的评论
        if (comment.user_id === userId) {
          return false
        }
        
        // 如果评论已删除，不计算
        if (comment.is_deleted) {
          return false
        }
        
        // 如果评论创建时间晚于最后查看时间，则为未读
        const commentTime = new Date(comment.created_at).getTime()
        const isUnread = commentTime > lastViewTime
        
        if (isUnread) {
          console.log(`[Cloud] 未读评论:`, {
            content: comment.content?.substring(0, 50),
            createdAt: new Date(comment.created_at).toLocaleString(),
            userId: comment.user_id
          })
        }
        
        return isUnread
      })
      
      console.log(`[Cloud] 任务 ${task.title} 未读评论数量: ${unreadComments.length}`)
      unreadCount += unreadComments.length
    }
    
    console.log(`[Cloud] 项目册 ${todoBookId} 总未读评论数量: ${unreadCount}`)
    
    return {
      success: true,
      count: unreadCount
    }
  } catch (error) {
    console.error('获取未读评论数量失败:', error)
    return {
      success: false,
      error: createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取未读评论数量失败')
    }
  }
}

/**
 * 处理父子任务状态联动
 * @param {Object} context 云函数上下文
 * @param {Object} task 任务对象
 * @param {string} newStatus 新状态
 * @returns {Object} 处理结果 { success: boolean, error?: Object }
 */
async function handleParentChildStatusUpdate(context, task, newStatus) {
  const db = getDatabase(context)
  
  try {
    // 如果是子任务状态变更，检查是否需要更新父任务
    if (task.parent_id) {
      // 获取父任务信息
      const parentResult = await db.collection('todoitems').doc(task.parent_id).get()
      if (parentResult.data.length > 0) {
        const parentTask = parentResult.data[0]
        
        // 获取所有子任务
        const childrenResult = await db.collection('todoitems')
          .where({ parent_id: task.parent_id })
          .get()
        
        if (childrenResult.data.length > 0) {
          const children = childrenResult.data
          const completedChildren = children.filter(child => 
            child._id === task._id ? newStatus === 'completed' : child.status === 'completed'
          )
          
          // 更新父任务的子任务计数
          const parentUpdates = {
            completed_subtask_count: completedChildren.length,
            updated_at: new Date(),
            last_activity_at: new Date()
          }
          
          // 如果所有子任务都完成了，自动完成父任务
          if (completedChildren.length === children.length && parentTask.status !== 'completed') {
            parentUpdates.status = 'completed'
            parentUpdates.completed_at = new Date()
          }
          // 如果父任务已完成但有子任务变为未完成，父任务回退
          else if (completedChildren.length < children.length && parentTask.status === 'completed') {
            parentUpdates.status = 'todo'
            parentUpdates.completed_at = null
          }
          
          await db.collection('todoitems').doc(task.parent_id).update(parentUpdates)
        }
      }
    }
    
    // 如果是父任务状态变更，更新子任务计数
    if (task.subtask_count > 0) {
      const childrenResult = await db.collection('todoitems')
        .where({ parent_id: task._id })
        .get()
      
      if (childrenResult.data.length > 0) {
        const completedChildren = childrenResult.data.filter(child => child.status === 'completed')
        
        await db.collection('todoitems').doc(task._id).update({
          completed_subtask_count: completedChildren.length,
          updated_at: new Date(),
          last_activity_at: new Date()
        })
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('处理父子状态联动失败:', error)
    // 不抛出异常，避免影响主要的状态更新流程
    return { success: false }
  }
}

module.exports = {
  updateTodoBookStats,
  getTodoBookTaskStats,
  getTodoBookMemberCount,
  getTodoBookUnreadCommentCount,
  handleParentChildStatusUpdate
}