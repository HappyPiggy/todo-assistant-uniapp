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
    
    let taskCount = 0
    const taskIdMapping = new Map() // 记录原任务ID到新任务ID的映射
    
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
        creator_id: isTemplate ? templateCreatorId : newCreatorId
      }
      
      const newTaskResult = await taskCollection.add(newTaskData)
      taskIdMapping.set(originalTask._id, newTaskResult.id)
      taskCount++
    }
    
    // 4. 更新任务的parent_id关系
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
        }
      }
    }
    
    // 5. 克隆评论（如果需要）
    if (includeComments) {
      const commentCollection = db.collection('todoitems_comments')
      const commentsResult = await commentCollection.where({
        todobook_id: originalBookId
      }).get()
      
      for (const originalComment of commentsResult.data) {
        if (taskIdMapping.has(originalComment.task_id)) {
          const newTaskId = taskIdMapping.get(originalComment.task_id)
          const newCommentData = {
            todobook_id: newBookId,
            task_id: newTaskId,
            content: originalComment.content,
            created_at: new Date(),
            updated_at: new Date(),
            creator_id: isTemplate ? templateCreatorId : newCreatorId
          }
          
          if (originalComment.parent_comment_id) {
            // 对于嵌套评论，这里简化处理，暂不处理parent关系
            // 实际项目中可能需要更复杂的映射逻辑
          }
          
          await commentCollection.add(newCommentData)
        }
      }
    }
    
    // 6. 更新项目册任务计数
    await bookCollection.doc(newBookId).update({
      item_count: taskCount,
      completed_count: 0
    })
    
    return newBookId
    
  } catch (error) {
    console.error('克隆项目册失败:', error)
    throw error
  }
}

module.exports = {
  cloneTodoBook
}