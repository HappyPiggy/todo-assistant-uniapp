/**
 * 编辑评论
 */
module.exports = async function updateTaskComment(params) {
  const { commentId, content } = params
  const { db, userInfo, uid } = this
  
  // 参数验证
  if (!commentId || !content || content.trim().length === 0) {
    return {
      code: 400,
      message: '评论ID和内容不能为空'
    }
  }

  if (content.length > 1000) {
    return {
      code: 400,
      message: '评论内容不能超过1000个字符'
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
    
    // 找到要编辑的评论
    const commentIndex = comments.findIndex(c => c._id === commentId)
    if (commentIndex === -1 || comments[commentIndex].is_deleted) {
      return {
        code: 404,
        message: '评论不存在'
      }
    }

    const comment = comments[commentIndex]
    
    // 检查权限：只有评论作者可以编辑
    if (comment.user_id !== uid) {
      return {
        code: 403,
        message: '无权限编辑此评论'
      }
    }

    // 更新评论内容
    comments[commentIndex].content = content.trim()
    comments[commentIndex].updated_at = new Date()

    // 更新任务的评论数组
    await db.collection('todoitems')
      .doc(task._id)
      .update({
        comments: comments,
        updated_at: new Date()
      })

    return {
      code: 0,
      data: {
        comment: comments[commentIndex]
      },
      message: '评论编辑成功'
    }
  } catch (error) {
    console.error('编辑评论失败:', error)
    return {
      code: 500,
      message: '编辑评论失败'
    }
  }
}