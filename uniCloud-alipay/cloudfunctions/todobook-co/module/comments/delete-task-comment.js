/**
 * 删除评论（软删除）
 */
module.exports = async function deleteTaskComment(params) {
  const { commentId } = params
  const { db, userInfo, uid } = this
  
  if (!commentId) {
    return {
      code: 400,
      message: '评论ID不能为空'
    }
  }

  try {
    // 查找包含该评论的任务
    const tasksResult = await db.collection('todoitems')
      .where({
        'comments._id': commentId
      })
      .get()

    if (tasksResult.data.length === 0) {
      return {
        code: 404,
        message: '评论不存在'
      }
    }

    const task = tasksResult.data[0]
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