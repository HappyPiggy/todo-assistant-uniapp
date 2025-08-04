// 从所有任务中删除指定标签
const { checkTodoBookPermission } = require('../utils/permission')
const { batchProcess } = require('../utils/batch-update')

/**
 * 从所有任务中删除指定标签
 * @param {String} bookId - TodoBook ID
 * @param {String} tagId - 标签 ID
 */
async function removeTagFromTasks(bookId, tagId) {
  const { db, uid } = this
  const todoItemsCollection = db.collection('todoitems') // 修正表名
  const dbCmd = db.command // 获取数据库命令
  
  console.log('[removeTagFromTasks] 开始执行，参数:', {
    bookId,
    tagId,
    uid,
    timestamp: new Date().toISOString()
  })
  
  // 参数验证
  if (!bookId || !tagId) {
    console.error('[removeTagFromTasks] 参数验证失败:', { bookId, tagId })
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
    
    // 定义查询条件 - 使用 elemMatch 查询数组中的对象
    const where = {
      todobook_id: bookId,
      tags: dbCmd.elemMatch({
        id: tagId
      })
    }
    
    console.log('[removeTagFromTasks] 查询条件:', JSON.stringify(where, null, 2))
    
    // 测试直接查询
    console.log('[removeTagFromTasks] 测试查询...')
    const testQuery = await todoItemsCollection
      .where(where)
      .limit(1)
      .get()
    console.log('[removeTagFromTasks] 测试查询结果:', {
      count: testQuery.data ? testQuery.data.length : 0,
      firstRecord: testQuery.data && testQuery.data[0] ? {
        _id: testQuery.data[0]._id,
        title: testQuery.data[0].title,
        tags: testQuery.data[0].tags
      } : null
    })
    
    // 使用批量处理工具处理所有匹配的任务
    const result = await batchProcess({
      collection: todoItemsCollection,
      where: where,
      batchSize: 500, // 每批处理500条
      operation: '删除标签',
      processRecord: async (task) => {
        console.log('[removeTagFromTasks] 处理任务:', {
          taskId: task._id,
          taskTitle: task.title,
          originalTags: JSON.stringify(task.tags, null, 2)
        })
        
        // 过滤掉要删除的标签
        const updatedTags = task.tags.filter(tag => {
          const shouldRemove = tag.id === tagId
          if (shouldRemove) {
            console.log('[removeTagFromTasks] 删除标签:', JSON.stringify(tag, null, 2))
          }
          return !shouldRemove
        })
        
        console.log('[removeTagFromTasks] 准备更新任务，更新数据:', {
          taskId: task._id,
          updatedTags: JSON.stringify(updatedTags, null, 2),
          originalTagCount: task.tags.length,
          updatedTagCount: updatedTags.length
        })
        
        // 更新任务
        const updateResult = await todoItemsCollection.doc(task._id).update({
          tags: updatedTags,
          updated_at: Date.now(),
          last_activity_at: new Date()
        })
        
        console.log('[removeTagFromTasks] 更新结果:', {
          taskId: task._id,
          updateResult: JSON.stringify(updateResult, null, 2)
        })
        
        if (!updateResult || updateResult.updated === 0) {
          console.error('[removeTagFromTasks] 更新失败:', { taskId: task._id, updateResult })
          throw new Error('更新失败')
        }
      }
    })
    
    console.log('[removeTagFromTasks] 批量处理完成:', {
      totalCount: result.totalCount,
      successCount: result.successCount,
      failCount: result.failCount,
      errors: result.errors
    })
    
    if (result.totalCount === 0) {
      console.log('[removeTagFromTasks] 没有找到使用此标签的任务')
      return {
        code: 0,
        message: '没有任务使用此标签',
        data: {
          updatedCount: 0,
          failedCount: 0,
          totalCount: 0
        }
      }
    }
    
    // 如果有失败的记录，记录警告
    if (result.failCount > 0) {
      console.warn(`标签删除部分失败：成功 ${result.successCount} 个，失败 ${result.failCount} 个`)
    }
    
    return {
      code: 0,
      message: result.failCount === 0 ? '标签删除成功' : '标签删除部分成功',
      data: {
        updatedCount: result.successCount,
        failedCount: result.failCount,
        totalCount: result.totalCount,
        errors: result.errors // 返回错误详情供调试
      }
    }
    
  } catch (error) {
    console.error('[removeTagFromTasks] 删除标签失败:', {
      error: error.message,
      stack: error.stack,
      bookId,
      tagId
    })
    return {
      code: 500,
      message: '删除标签失败: ' + error.message
    }
  }
}

module.exports = removeTagFromTasks