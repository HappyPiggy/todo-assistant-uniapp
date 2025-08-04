// 批量更新任务中的标签信息
const { checkTodoBookPermission } = require('../utils/permission')

/**
 * 批量更新任务中的标签信息
 * @param {String} bookId - TodoBook ID
 * @param {String} tagId - 标签 ID
 * @param {Object} tagData - 新的标签数据 {name, color}
 */
async function updateTagInTasks(bookId, tagId, tagData) {
  const { db, uid } = this
  const todoItemsCollection = db.collection('todo-items')
  
  // 参数验证
  if (!bookId || !tagId || !tagData) {
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
    
    console.log(`找到 ${tasksRes.data.length} 个任务需要更新标签`)
    
    // 批量更新任务中的标签
    const updatePromises = tasksRes.data.map(async (task) => {
      // 更新标签数组中对应的标签
      const updatedTags = task.tags.map(tag => {
        if (tag.id === tagId) {
          return {
            ...tag,
            name: tagData.name,
            color: tagData.color
          }
        }
        return tag
      })
      
      // 更新任务
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
      console.warn(`标签更新部分失败：成功 ${successCount} 个，失败 ${failCount} 个`)
    }
    
    return {
      code: 0,
      message: '标签同步成功',
      data: {
        updatedCount: successCount,
        failedCount: failCount,
        totalCount: tasksRes.data.length
      }
    }
    
  } catch (error) {
    console.error('标签同步失败:', error)
    return {
      code: 500,
      message: '标签同步失败: ' + error.message
    }
  }
}

module.exports = updateTagInTasks