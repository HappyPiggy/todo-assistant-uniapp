// 更新任务信息
const { checkTaskPermission } = require('../../lib/utils/permission')

async function updateTodoItem(taskId, updateData) {
  const { db, uid } = this

  if (!taskId) {
    return {
      code: 400,
      message: '任务ID不能为空'
    }
  }

  try {
    // 获取任务信息
    const taskRes = await db.collection('todoitems').doc(taskId).get()
    if (!taskRes.data || taskRes.data.length === 0) {
      return {
        code: 404,
        message: '任务不存在'
      }
    }

    const task = taskRes.data[0]

    // 检查权限
    const hasPermission = await checkTaskPermission.call(this, task.todobook_id, 'update')
    if (!hasPermission) {
      return {
        code: 403,
        message: '无权限修改此任务'
      }
    }

    // 准备更新数据
    const now = new Date()
    const finalUpdateData = {
      ...updateData,
      updated_at: now,
      last_activity_at: now
    }

    // 处理标签数据：确保新格式标签有正确的结构
    if (finalUpdateData.tags && Array.isArray(finalUpdateData.tags)) {
      finalUpdateData.tags = finalUpdateData.tags.map(tag => {
        if (typeof tag === 'object') {
          // 验证标签对象格式
          if (!tag.id || !tag.name || !tag.color) {
            throw new Error('标签格式错误：缺少必要字段')
          }
          if (tag.name.length > 5) {
            throw new Error('标签名称不能超过5个字符')
          }
          if (!/^#[0-9A-Fa-f]{6}$/.test(tag.color)) {
            throw new Error('标签颜色格式错误')
          }
          return {
            id: tag.id,
            name: tag.name,
            color: tag.color
          }
        } else if (typeof tag === 'string') {
          // 兼容旧格式
          if (tag.length > 20) {
            throw new Error('标签名称过长')
          }
          return tag
        } else {
          throw new Error('标签格式错误')
        }
      })
    }

    // 如果状态改为完成，设置完成时间
    if (finalUpdateData.status === 'completed' && task.status !== 'completed') {
      finalUpdateData.completed_at = now
    } else if (finalUpdateData.status !== 'completed' && task.status === 'completed') {
      // 如果从完成改为其他状态，清除完成时间
      finalUpdateData.completed_at = null
    }

    // 执行更新
    const updateRes = await db.collection('todoitems').doc(taskId).update(finalUpdateData)

    if (updateRes.updated === 1) {
      // 如果是父任务状态变更，需要更新子任务统计
      if (finalUpdateData.status && task.parent_id) {
        await updateParentTaskProgress.call(this, task.parent_id)
      }

      // 如果当前任务有子任务，且状态变更为完成，也需要更新子任务
      if (finalUpdateData.status === 'completed' && task.subtask_count > 0) {
        await updateSubtasksStatus.call(this, taskId, 'completed')
      }

      return {
        code: 0,
        message: '更新成功',
        data: {
          taskId: taskId,
          updatedAt: now
        }
      }
    } else {
      return {
        code: 500,
        message: '更新失败'
      }
    }

  } catch (error) {
    console.error('更新任务失败:', error)
    return {
      code: 500,
      message: error.message || '更新任务失败'
    }
  }
}

// 更新父任务进度
async function updateParentTaskProgress(parentId) {
  const db = this.db
  
  try {
    // 获取所有子任务
    const subtasksRes = await db.collection('todoitems')
      .where({
        parent_id: parentId
      })
      .get()

    const subtasks = subtasksRes.data
    const totalCount = subtasks.length
    const completedCount = subtasks.filter(task => task.status === 'completed').length

    // 更新父任务统计
    await db.collection('todoitems').doc(parentId).update({
      subtask_count: totalCount,
      completed_subtask_count: completedCount,
      updated_at: new Date()
    })

  } catch (error) {
    console.error('更新父任务进度失败:', error)
  }
}

// 更新子任务状态
async function updateSubtasksStatus(parentId, status) {
  const db = this.db
  
  try {
    const now = new Date()
    const updateData = {
      status: status,
      updated_at: now
    }

    if (status === 'completed') {
      updateData.completed_at = now
    }

    await db.collection('todoitems')
      .where({
        parent_id: parentId
      })
      .update(updateData)

  } catch (error) {
    console.error('更新子任务状态失败:', error)
  }
}

module.exports = updateTodoItem