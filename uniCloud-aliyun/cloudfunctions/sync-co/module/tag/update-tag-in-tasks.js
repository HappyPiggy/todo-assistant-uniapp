// 批量更新任务中的标签信息
const { checkTodoBookPermission } = require('../utils/permission')
const { batchProcess } = require('../utils/batch-update')

/**
 * 批量更新任务中的标签信息
 * @param {String} bookId - TodoBook ID
 * @param {String} tagId - 标签 ID
 * @param {Object} tagData - 新的标签数据 {name, color}
 */
async function updateTagInTasks(bookId, tagId, tagData) {
  const { db, uid } = this
  const todoItemsCollection = db.collection('todoitems') // 修正表名
  const dbCmd = db.command // 获取数据库命令
  
  console.log('[updateTagInTasks] 开始执行，参数:', {
    bookId,
    tagId,
    tagData,
    uid,
    timestamp: new Date().toISOString()
  })
  
  // 参数验证
  if (!bookId || !tagId || !tagData) {
    console.error('[updateTagInTasks] 参数验证失败:', { bookId, tagId, tagData })
    return {
      code: 400,
      message: '参数错误：缺少必要参数'
    }
  }
  
  if (!tagData.name || !tagData.color) {
    return {
      code: 400,
      message: '参数错误：标签数据不完整'
    }
  }
  
  // 验证标签名称长度
  if (tagData.name.length > 5) {
    return {
      code: 400,
      message: '标签名称不能超过5个字符'
    }
  }
  
  // 验证颜色格式
  if (!/^#[0-9A-Fa-f]{6}$/.test(tagData.color)) {
    return {
      code: 400,
      message: '标签颜色格式错误'
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
    
    console.log('[updateTagInTasks] 查询条件:', JSON.stringify(where, null, 2))
    
    // 测试直接查询
    console.log('[updateTagInTasks] 测试查询...')
    const testQuery = await todoItemsCollection
      .where(where)
      .limit(1)
      .get()
    console.log('[updateTagInTasks] 测试查询结果:', {
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
      operation: '更新标签',
      processRecord: async (task) => {
        console.log('[updateTagInTasks] 处理任务:', {
          taskId: task._id,
          taskTitle: task.title,
          originalTags: JSON.stringify(task.tags, null, 2)
        })
        
        // 更新标签数组中对应的标签
        const updatedTags = task.tags.map(tag => {
          if (tag.id === tagId) {
            console.log('[updateTagInTasks] 找到匹配标签，更新前:', JSON.stringify(tag, null, 2))
            const updatedTag = {
              ...tag,
              name: tagData.name,
              color: tagData.color
            }
            console.log('[updateTagInTasks] 更新后:', JSON.stringify(updatedTag, null, 2))
            return updatedTag
          }
          return tag
        })
        
        console.log('[updateTagInTasks] 准备更新任务，更新数据:', {
          taskId: task._id,
          updatedTags: JSON.stringify(updatedTags, null, 2),
          updated_at: Date.now(),
          last_activity_at: new Date()
        })
        
        // 更新任务
        const updateResult = await todoItemsCollection.doc(task._id).update({
          tags: updatedTags,
          updated_at: Date.now(),
          last_activity_at: new Date()
        })
        
        console.log('[updateTagInTasks] 更新结果:', {
          taskId: task._id,
          updateResult: JSON.stringify(updateResult, null, 2)
        })
        
        if (!updateResult || updateResult.updated === 0) {
          console.error('[updateTagInTasks] 更新失败:', { taskId: task._id, updateResult })
          throw new Error('更新失败')
        }
      }
    })
    
    console.log('[updateTagInTasks] 批量处理完成:', {
      totalCount: result.totalCount,
      successCount: result.successCount,
      failCount: result.failCount,
      errors: result.errors
    })
    
    if (result.totalCount === 0) {
      console.log('[updateTagInTasks] 没有找到使用此标签的任务')
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
      console.warn(`标签更新部分失败：成功 ${result.successCount} 个，失败 ${result.failCount} 个`)
    }
    
    return {
      code: 0,
      message: result.failCount === 0 ? '标签同步成功' : '标签同步部分成功',
      data: {
        updatedCount: result.successCount,
        failedCount: result.failCount,
        totalCount: result.totalCount,
        errors: result.errors // 返回错误详情供调试
      }
    }
    
  } catch (error) {
    console.error('[updateTagInTasks] 标签同步失败:', {
      error: error.message,
      stack: error.stack,
      bookId,
      tagId,
      tagData
    })
    return {
      code: 500,
      message: '标签同步失败: ' + error.message
    }
  }
}

module.exports = updateTagInTasks