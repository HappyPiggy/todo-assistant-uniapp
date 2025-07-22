// 删除任务
const { checkTodoBookPermission } = require('../../lib/utils/permission')

module.exports = async function deleteTask(taskId) {
  console.log('[deleteTask] 开始删除任务:', taskId)
  
  // 验证参数
  if (!taskId) {
    return {
      code: 400,
      message: '任务ID无效'
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
        message: '无权限删除此任务'
      }
    }
    
    // 检查是否为任务创建者或有管理权限
    if (task.creator_id !== uid) {
      // 如果不是创建者，检查是否为项目册管理员
      const memberResult = await db.collection('todobook_members')
        .where({
          todobook_id: task.todobook_id,
          user_id: uid,
          role: db.command.in(['owner', 'admin'])
        })
        .get()
      console.log(JSON.stringify(memberResult, null, 2),task.creator_id, uid)
      
      if (!memberResult.data || memberResult.data.length === 0) {
        return {
          code: 403,
          message: '只能删除自己创建的任务或需要管理员权限'
        }
      }
    }
    
    // 统计要删除的任务数量（用于更新项目册统计）
    let totalDeletedTasks = 1
    let totalDeletedCompletedTasks = task.status === 'completed' ? 1 : 0
    
    // 如果是父任务，先删除所有子任务
    if (!task.parent_id) {
      // 查找所有子任务
      const subtasksResult = await db.collection('todoitems')
        .where({
          parent_id: taskId
        })
        .get()
      
      if (subtasksResult.data && subtasksResult.data.length > 0) {
        console.log(`[deleteTask] 找到 ${subtasksResult.data.length} 个子任务，开始删除`)
        
        // 统计子任务数量
        totalDeletedTasks += subtasksResult.data.length
        totalDeletedCompletedTasks += subtasksResult.data.filter(subtask => subtask.status === 'completed').length
        
        // 删除所有子任务
        for (const subtask of subtasksResult.data) {
          await db.collection('todoitems').doc(subtask._id).remove()
        }
      }
    }
    
    // 删除任务本身（包括其评论，因为评论是任务文档的一部分）
    await db.collection('todoitems').doc(taskId).remove()
    
    // 如果是子任务，更新父任务的子任务计数
    if (task.parent_id) {
      const parentResult = await db.collection('todoitems')
        .doc(task.parent_id)
        .get()
      
      if (parentResult.data && parentResult.data.length > 0) {
        const parentTask = parentResult.data[0]
        const newSubtaskCount = Math.max(0, (parentTask.subtask_count || 0) - 1)
        let newCompletedCount = parentTask.completed_subtask_count || 0
        
        // 如果删除的是已完成的子任务，减少已完成计数
        if (task.status === 'completed') {
          newCompletedCount = Math.max(0, newCompletedCount - 1)
        }
        
        await db.collection('todoitems')
          .doc(task.parent_id)
          .update({
            subtask_count: newSubtaskCount,
            completed_subtask_count: newCompletedCount,
            updated_at: new Date(),
            last_activity_at: new Date()
          })
      }
    }
    
    // 更新项目册的任务计数
    const todoBookResult = await db.collection('todobooks')
      .doc(task.todobook_id)
      .get()
    
    if (todoBookResult.data && todoBookResult.data.length > 0) {
      const todoBook = todoBookResult.data[0]
      const newItemCount = Math.max(0, (todoBook.item_count || 0) - totalDeletedTasks)
      const newCompletedCount = Math.max(0, (todoBook.completed_count || 0) - totalDeletedCompletedTasks)
      
      await db.collection('todobooks')
        .doc(task.todobook_id)
        .update({
          item_count: newItemCount,
          completed_count: newCompletedCount,
          last_activity_at: new Date(),
          updated_at: new Date()
        })
    }
    
    console.log('[deleteTask] 任务删除成功:', {
      taskId,
      title: task.title,
      isParentTask: !task.parent_id,
      parentId: task.parent_id,
      totalDeletedTasks,
      totalDeletedCompletedTasks
    })
    
    return {
      code: 0,
      message: '删除成功',
      data: {
        taskId,
        title: task.title,
        deletedAt: new Date(),
        deletedSubtasks: totalDeletedTasks - 1
      }
    }
    
  } catch (error) {
    console.error('[deleteTask] 删除任务失败:', error)
    return {
      code: 500,
      message: '删除失败: ' + error.message
    }
  }
}