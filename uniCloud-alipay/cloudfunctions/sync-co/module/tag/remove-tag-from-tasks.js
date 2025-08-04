// 从所有任务中删除指定标签
const { checkTodoBookPermission } = require('../utils/permission')

/**
 * 从所有任务中删除指定标签
 * @param {String} bookId - TodoBook ID
 * @param {String} tagId - 标签 ID
 */
async function removeTagFromTasks(bookId, tagId) {
  const { db, uid } = this
  const todoItemsCollection = db.collection('todo-items')
  
  // 参数验证
  if (!bookId || !tagId) {
    return {
      code: 400,
      message: '参数错误：缺少必要参数'
    }
  }
  
  try {
    // 检查用户对 TodoBook 的写权限
    const permissionResult = await checkTodoBookPermission(this, uid, bookId, 'write')
    if (!permissionResult.success) {
      return {
        code: 403,
        message: permissionResult.error?.message || '无权限访问此 TodoBook'
      }
    }
    
    // 查找所有包含该标签的任务
    const tasksRes = await todoItemsCollection
      .where({
        todobook_id: bookId,
        'tags.id': tagId
      })
      .limit(1000) // 限制一次处理的数量
      .get()
    
    if (!tasksRes.data || tasksRes.data.length === 0) {
      return {
        code: 0,
        message: '没有任务使用此标签',
        data: {
          updatedCount: 0
        }
      }
    }
    
    console.log(`找到 ${tasksRes.data.length} 个任务需要移除标签`)
    
    // 批量更新任务，移除标签
    const updatePromises = tasksRes.data.map(async (task) => {
      const updatedTags = task.tags.filter(tag => tag.id !== tagId)
      
      return todoItemsCollection.doc(task._id).update({
        tags: updatedTags,
        updated_at: Date.now(),
        last_activity_at: new Date()
      })
    })
    
    // 执行所有更新
    const results = await Promise.allSettled(updatePromises)
    
    // 统计成功和失败的数量
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length
    
    if (failCount > 0) {
      console.warn(`标签删除部分失败：成功 ${successCount} 个，失败 ${failCount} 个`)
    }
    
    return {
      code: 0,
      message: '标签删除成功',
      data: {
        updatedCount: successCount,
        failedCount: failCount,
        totalCount: tasksRes.data.length
      }
    }
    
  } catch (error) {
    console.error('删除标签失败:', error)
    return {
      code: 500,
      message: '删除标签失败: ' + error.message
    }
  }
}

module.exports = removeTagFromTasks