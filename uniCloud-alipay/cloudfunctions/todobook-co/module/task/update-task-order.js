// 更新任务排序
const { checkTodoBookPermission } = require('../../lib/utils/permission')

module.exports = async function updateTaskOrder(taskId, newOrder) {
  console.log('[updateTaskOrder] 开始更新任务排序:', { taskId, newOrder })
  
  // 验证参数
  if (!taskId) {
    return {
      code: 400,
      message: '任务ID无效'
    }
  }
  
  if (typeof newOrder !== 'number' || newOrder < 0) {
    return {
      code: 400,
      message: '排序值无效'
    }
  }
  
  try {
    const { uid, db } = this
    
    // 获取任务信息
    const taskResult = await db.collection('todoitems')
      .doc(taskId)
      .get()
    
    if (!taskResult.data || taskResult.data.length === 0) {
      return {
        code: 404,
        message: '任务不存在'
      }
    }
    
    const task = taskResult.data[0]
    
    // 检查项目册权限
    const hasPermission = await checkTodoBookPermission(task.todobook_id, uid, 'update')
    if (!hasPermission) {
      return {
        code: 403,
        message: '无权限操作此任务'
      }
    }
    
    // 更新任务排序
    const updateResult = await db.collection('todoitems')
      .doc(taskId)
      .update({
        sort_order: newOrder,
        updated_at: new Date()
      })
    
    if (updateResult.updated === 0) {
      return {
        code: 500,
        message: '更新排序失败'
      }
    }
    
    // 如果是子任务，需要同时更新同级其他子任务的排序
    if (task.parent_id) {
      // 获取同级所有子任务
      const siblingsResult = await db.collection('todoitems')
        .where({
          parent_id: task.parent_id,
          _id: db.command.neq(taskId)
        })
        .orderBy('sort_order', 'asc')
        .get()
      
      // 重新计算排序
      const siblings = siblingsResult.data
      const batch = db.batch()
      
      let currentOrder = 0
      
      // 为每个子任务重新分配排序值
      for (let i = 0; i <= siblings.length; i++) {
        if (i === newOrder) {
          // 跳过当前位置，这是被移动任务的新位置
          currentOrder++
          continue
        }
        
        if (i < siblings.length) {
          const sibling = siblings[i]
          if (sibling.sort_order !== currentOrder) {
            batch.update(sibling._id, {
              sort_order: currentOrder,
              updated_at: new Date()
            })
          }
          currentOrder++
        }
      }
      
      // 批量更新
      if (batch.operations.length > 0) {
        await batch.commit()
      }
    }
    
    console.log('[updateTaskOrder] 任务排序更新成功:', { taskId, newOrder })
    
    return {
      code: 0,
      message: '排序更新成功',
      data: {
        taskId,
        newOrder
      }
    }
    
  } catch (error) {
    console.error('[updateTaskOrder] 更新任务排序失败:', error)
    return {
      code: 500,
      message: '更新排序失败: ' + error.message
    }
  }
}