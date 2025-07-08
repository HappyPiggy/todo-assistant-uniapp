/**
 * 删除评论（软删除）
 */
module.exports = async function deleteTaskComment(params) {
  const { commentId } = params
  
  // 重新进行用户验证，确保获取最新的用户信息
  const token = this.getUniIdToken()
  if (!token) {
    return {
      code: 30202,
      message: '用户未登录或token已过期'
    }
  }
  
  const payload = await this.uniID.checkToken(token)
  if (payload.code !== 0) {
    return {
      code: payload.code || 30202,
      message: payload.message || payload.errMsg || '用户未登录或token已过期'
    }
  }

  const uid = payload.uid
  const db = this.db || uniCloud.database()
  
  if (!commentId) {
    return {
      code: 400,
      message: '评论ID不能为空'
    }
  }

  try {
    // 从 commentId 中提取 taskId（commentId 格式：taskId_timestamp_random）
    const taskId = commentId.split('_')[0]
    if (!taskId) {
      return {
        code: 400,
        message: '评论ID格式错误'
      }
    }

    // 根据 taskId 查找任务
    const taskResult = await db.collection('todoitems')
      .doc(taskId)
      .get()

    if (taskResult.data.length === 0) {
      return {
        code: 404,
        message: '任务不存在'
      }
    }

    const task = taskResult.data[0]
    let comments = task.comments || []
    
    // 找到要删除的评论
    const commentIndex = comments.findIndex(c => c._id === commentId)
    if (commentIndex === -1 || comments[commentIndex].is_deleted) {
      return {
        code: 404,
        message: '评论不存在'
      }
    }

    const comment = comments[commentIndex]
    
    // 检查权限：评论作者或项目册owner可以删除
    let canDelete = false
    if (comment.user_id === uid) {
      canDelete = true
    } else {
      // 检查是否是项目册owner
      const todobookResult = await db.collection('todobooks')
        .doc(task.todobook_id)
        .field({
          creator_id: true
        })
        .get()
      
      if (todobookResult.data.length > 0 && todobookResult.data[0].creator_id === uid) {
        canDelete = true
      }
    }

    if (!canDelete) {
      return {
        code: 403,
        message: '无权限删除此评论'
      }
    }

    // 软删除评论
    comments[commentIndex].is_deleted = true
    comments[commentIndex].deleted_at = new Date()

    // 同时软删除该评论的所有回复
    comments.forEach((c, index) => {
      if (c.reply_to === commentId && !c.is_deleted) {
        comments[index].is_deleted = true
        comments[index].deleted_at = new Date()
      }
    })

    // 更新任务的评论数组
    await db.collection('todoitems')
      .doc(task._id)
      .update({
        comments: comments,
        updated_at: new Date()
      })

    return {
      code: 0,
      message: '评论删除成功'
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    return {
      code: 500,
      message: '删除评论失败'
    }
  }
}