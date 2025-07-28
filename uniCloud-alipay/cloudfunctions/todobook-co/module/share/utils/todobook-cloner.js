/**
 * 项目册克隆工具
 * 用于创建分享模板和导入项目册
 */

/**
 * 深度克隆项目册结构
 * @param {object} db - 数据库对象
 * @param {string} originalBookId - 原项目册ID
 * @param {object} options - 克隆选项
 * @param {boolean} options.includeComments - 是否包含评论
 * @param {boolean} options.isTemplate - 是否为分享模板
 * @param {string} options.templateCreatorId - 模板创建者ID
 * @param {string} options.newCreatorId - 新项目册创建者ID
 * @param {string} options.titleSuffix - 标题后缀
 * @returns {Promise<string>} 新项目册ID
 */
async function cloneTodoBook(db, originalBookId, options = {}) {
  const {
    includeComments = false,
    isTemplate = false,
    templateCreatorId = null,
    newCreatorId = null,
    titleSuffix = ''
  } = options

  try {
    // 1. 获取原项目册信息
    const bookCollection = db.collection('todobooks')
    const originalBookResult = await bookCollection.doc(originalBookId).get()
    
    if (originalBookResult.data.length === 0) {
      throw new Error('原项目册不存在')
    }
    
    const originalBook = originalBookResult.data[0]
    
    // 2. 创建新项目册
    const newBookData = {
      title: originalBook.title + titleSuffix,
      description: originalBook.description || '',
      color: originalBook.color || '#007AFF',
      icon: originalBook.icon || 'folder',
      is_shared: false,
      share_type: 'private',
      member_count: 1,
      item_count: 0,
      completed_count: 0,
      sort_order: 0,
      is_archived: false,
      is_share_template: isTemplate,
      created_at: new Date(),
      updated_at: new Date(),
      last_activity_at: new Date()
    }
    
    // 如果是分享模板，记录原始项目册ID用于重复分享检查
    if (isTemplate) {
      newBookData.original_todobook_id = originalBookId
    }
    
    // 设置创建者
    if (isTemplate && templateCreatorId) {
      newBookData.template_creator_id = templateCreatorId
      newBookData.template_created_at = new Date()
      // 分享模板不设置creator_id，表示不属于任何用户
    } else if (newCreatorId) {
      newBookData.creator_id = newCreatorId
    }
    
    const newBookResult = await bookCollection.add(newBookData)
    const newBookId = newBookResult.id
    
    // 3. 获取并克隆任务
    const taskCollection = db.collection('todoitems')
    const tasksResult = await taskCollection.where({
      todobook_id: originalBookId
    }).orderBy('sort_order', 'asc').get()
    
    // 调试信息：分析原始任务结构
    console.log(`🔍 [克隆调试] 原项目册 ${originalBookId} 总任务数: ${tasksResult.data.length}`)
    const parentTasks = tasksResult.data.filter(task => !task.parent_id)
    const childTasks = tasksResult.data.filter(task => task.parent_id)
    console.log(`🔍 [克隆调试] 父任务数: ${parentTasks.length}, 子任务数: ${childTasks.length}`)
    
    // 打印父子关系映射
    if (childTasks.length > 0) {
      console.log('🔍 [克隆调试] 子任务父子关系:')
      childTasks.forEach(child => {
        console.log(`  - 子任务 ${child._id} (${child.title}) -> 父任务 ${child.parent_id}`)
      })
    }
    
    let taskCount = 0
    const taskIdMapping = new Map() // 记录原任务ID到新任务ID的映射
    const userAnonymizeMapping = new Map() // 用户匿名化映射
    let anonymousUserCounter = 0 // 匿名用户计数器
    
    // 辅助函数：获取匿名用户ID
    const getAnonymousUserId = (originalUserId) => {
      if (!userAnonymizeMapping.has(originalUserId)) {
        anonymousUserCounter++
        const anonymousId = `anonymous_user_${String.fromCharCode(64 + anonymousUserCounter)}` // A, B, C...
        userAnonymizeMapping.set(originalUserId, anonymousId)
      }
      return userAnonymizeMapping.get(originalUserId)
    }
    
    // 辅助函数：更新评论ID以匹配新任务ID
    const updateCommentIds = (comments, newTaskId) => {
      if (!comments || !Array.isArray(comments)) return []
      
      const commentIdMapping = new Map() // 记录旧评论ID到新评论ID的映射
      
      // 第一轮：生成新的评论ID并建立映射关系
      const updatedComments = comments.map(comment => {
        const updatedComment = { ...comment }
        
        // 从原评论ID中提取时间戳和随机字符串部分
        const commentParts = comment._id.split('_')
        if (commentParts.length >= 3) {
          const timestamp = commentParts[1]
          const random = commentParts[2]
          const newCommentId = `${newTaskId}_${timestamp}_${random}`
          
          // 记录映射关系
          commentIdMapping.set(comment._id, newCommentId)
          updatedComment._id = newCommentId
          
          console.log(`🔍 [评论ID更新] ${comment._id} -> ${newCommentId}`)
        }
        
        return updatedComment
      })
      
      // 第二轮：更新reply_to字段中的评论ID引用
      return updatedComments.map(comment => {
        if (comment.reply_to && commentIdMapping.has(comment.reply_to)) {
          comment.reply_to = commentIdMapping.get(comment.reply_to)
          console.log(`🔍 [回复关系更新] reply_to: ${comment.reply_to}`)
        }
        return comment
      })
    }
    
    // 辅助函数：匿名化评论数组
    const anonymizeComments = (comments) => {
      if (!comments || !Array.isArray(comments)) return []
      
      return comments.map(comment => {
        const anonymizedComment = { ...comment }
        // 匿名化主评论的用户ID
        anonymizedComment.user_id = getAnonymousUserId(comment.user_id)
        
        // 匿名化回复中的用户ID
        if (comment.replies && Array.isArray(comment.replies)) {
          anonymizedComment.replies = comment.replies.map(reply => ({
            ...reply,
            user_id: getAnonymousUserId(reply.user_id)
          }))
        }
        
        return anonymizedComment
      })
    }
    
    for (const originalTask of tasksResult.data) {
      const newTaskData = {
        todobook_id: newBookId,
        title: originalTask.title,
        description: originalTask.description || '',
        status: 'todo', // 重置为未完成状态
        priority: originalTask.priority || 'medium',
        tags: originalTask.tags || [],
        due_date: originalTask.due_date,
        estimated_hours: originalTask.estimated_hours || 0,
        level: originalTask.level || 0,
        parent_id: originalTask.parent_id || null,
        sort_order: originalTask.sort_order || 0,
        created_at: new Date(),
        updated_at: new Date(),
        // 清除完成相关时间戳
        completed_at: null,
        // 如果是分享模板，设置模板创建者
        creator_id: isTemplate ? templateCreatorId : newCreatorId,
        // 处理评论：如果需要包含评论则复制，对于分享模板进行匿名化处理
        comments: (() => {
          console.log(`🔍 [评论处理调试] 任务 ${originalTask._id} (${originalTask.title})`)
          console.log(`🔍 [评论处理调试] includeComments: ${includeComments}`)
          console.log(`🔍 [评论处理调试] isTemplate: ${isTemplate}`)
          console.log(`🔍 [评论处理调试] 原始评论数量: ${(originalTask.comments || []).length}`)
          
          if (!includeComments) {
            console.log(`🔍 [评论处理调试] 不包含评论，返回空数组`)
            return []
          }
          
          if (isTemplate) {
            console.log(`🔍 [评论处理调试] 是分享模板，进行匿名化处理`)
            const anonymizedComments = anonymizeComments(originalTask.comments || [])
            console.log(`🔍 [评论处理调试] 匿名化后评论数量: ${anonymizedComments.length}`)
            if (anonymizedComments.length > 0) {
              console.log(`🔍 [评论处理调试] 第一条匿名化评论用户ID: ${anonymizedComments[0].user_id}`)
            }
            return anonymizedComments
          } else {
            console.log(`🔍 [评论处理调试] 不是分享模板，直接复制评论`)
            return originalTask.comments || []
          }
        })()
      }
      
      const newTaskResult = await taskCollection.add(newTaskData)
      const newTaskId = newTaskResult.id
      taskIdMapping.set(originalTask._id, newTaskId)
      taskCount++
      
      // 调试信息：记录任务克隆
      console.log(`🔍 [克隆调试] 克隆任务: ${originalTask._id} -> ${newTaskId} (${originalTask.title})`)
      
      // 如果包含评论，需要更新评论ID以匹配新任务ID
      if (includeComments && newTaskData.comments && newTaskData.comments.length > 0) {
        console.log(`🔍 [评论ID修复] 开始更新任务 ${newTaskId} 的评论ID`)
        const updatedComments = updateCommentIds(newTaskData.comments, newTaskId)
        
        // 更新数据库中的评论
        await taskCollection.doc(newTaskId).update({
          comments: updatedComments
        })
        
        console.log(`🔍 [评论ID修复] 任务 ${newTaskId} 的评论ID更新完成，共更新 ${updatedComments.length} 条评论`)
      }
    }
    
    // 4. 更新任务的parent_id关系
    console.log('🔍 [克隆调试] 开始更新父子关系...')
    let parentChildUpdateCount = 0
    
    for (const [originalTaskId, newTaskId] of taskIdMapping) {
      const originalTaskResult = await taskCollection.where({
        todobook_id: originalBookId,
        _id: originalTaskId
      }).get()
      
      if (originalTaskResult.data.length > 0) {
        const originalTask = originalTaskResult.data[0]
        if (originalTask.parent_id && taskIdMapping.has(originalTask.parent_id)) {
          const newParentId = taskIdMapping.get(originalTask.parent_id)
          await taskCollection.doc(newTaskId).update({
            parent_id: newParentId
          })
          
          // 调试信息：记录父子关系更新
          console.log(`🔍 [克隆调试] 更新父子关系: 任务 ${newTaskId} 的父任务设为 ${newParentId}`)
          parentChildUpdateCount++
        }
      }
    }
    
    console.log(`🔍 [克隆调试] 父子关系更新完成，共更新 ${parentChildUpdateCount} 个子任务`)
    
    // 验证最终结果
    const finalTasksResult = await taskCollection.where({
      todobook_id: newBookId
    }).get()
    
    const finalParentTasks = finalTasksResult.data.filter(task => !task.parent_id)
    const finalChildTasks = finalTasksResult.data.filter(task => task.parent_id)
    console.log(`🔍 [克隆调试] 克隆结果验证 - 新项目册 ${newBookId}: 父任务 ${finalParentTasks.length}个, 子任务 ${finalChildTasks.length}个`)
    
    if (finalChildTasks.length > 0) {
      console.log('🔍 [克隆调试] 新项目册子任务关系:')
      finalChildTasks.forEach(child => {
        console.log(`  - 子任务 ${child._id} (${child.title}) -> 父任务 ${child.parent_id}`)
      })
    }
    
    // 5. 评论已在任务克隆时处理完毕
    
    // 6. 更新项目册任务计数
    await bookCollection.doc(newBookId).update({
      item_count: taskCount,
      completed_count: 0
    })
    
    // 7. 为导入的项目册创建成员记录（如果是用户导入，不是分享模板）
    if (!isTemplate && newCreatorId) {
      const { MEMBER_ROLE, PERMISSION_TYPE } = require('../../../common/constants')
      const now = new Date()
      
      await db.collection('todobook_members').add({
        todobook_id: newBookId,
        user_id: newCreatorId,
        role: MEMBER_ROLE.OWNER,
        permissions: [
          PERMISSION_TYPE.READ, 
          PERMISSION_TYPE.WRITE, 
          PERMISSION_TYPE.DELETE, 
          PERMISSION_TYPE.MANAGE_MEMBERS, 
          PERMISSION_TYPE.MANAGE_SETTINGS
        ],
        joined_at: now,
        last_access_at: now,
        is_active: true
      })
    }
    
    return newBookId
    
  } catch (error) {
    console.error('克隆项目册失败:', error)
    throw error
  }
}

module.exports = {
  cloneTodoBook
}