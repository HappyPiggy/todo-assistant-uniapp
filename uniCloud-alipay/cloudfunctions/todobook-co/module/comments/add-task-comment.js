/**
 * 添加任务评论
 */
module.exports = async function addTaskComment(params) {
  const { taskId, content, parentCommentId = null } = params
  const { db, userInfo, uid } = this
  
  // 参数验证
  if (!taskId || !content || content.trim().length === 0) {
    return {
      code: 400,
      message: '任务ID和评论内容不能为空'
    }
  }

  if (content.length > 1000) {
    return {
      code: 400,
      message: '评论内容不能超过1000个字符'
    }
  }

  try {
    // 验证任务是否存在
    const taskResult = await db.collection('todoitems')
      .doc(taskId)
      .field({
        comments: true,
        creator_id: true
      })
      .get()

    if (taskResult.data.length === 0) {
      return {
        code: 404,
        message: '任务不存在'
      }
    }

    const task = taskResult.data[0]
    let comments = task.comments || []

    // 验证父评论是否存在（如果是回复）
    if (parentCommentId) {
      const parentComment = comments.find(c => 
        c._id === parentCommentId && 
        !c.is_deleted && 
        !c.reply_to // 只能回复顶级评论
      )
      
      if (!parentComment) {
        return {
          code: 400,
          message: '父评论不存在或不允许回复'
        }
      }
    }

    // 获取用户信息
    const userResult = await db.collection('uni-id-users')
      .doc(uid)
      .field({
        nickname: true,
        avatar: true,
        username: true
      })
      .get()

    const user = userResult.data.length > 0 ? userResult.data[0] : {}
    
    // 创建新评论
    const now = new Date()
    const commentId = `${taskId}_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newComment = {
      _id: commentId,
      user_id: uid,
      content: content.trim(),
      created_at: now,
      is_deleted: false
    }

    if (parentCommentId) {
      newComment.reply_to = parentCommentId
    }

    // 添加评论到数组
    comments.push(newComment)

    // 更新任务的评论数组
    await db.collection('todoitems')
      .doc(taskId)
      .update({
        comments: comments,
        updated_at: now
      })

    // 返回带用户信息的评论
    newComment.user_nickname = user.nickname || user.username || '用户'
    newComment.user_avatar = user.avatar || ''

    return {
      code: 0,
      data: {
        commentId: commentId,
        comment: newComment
      },
      message: '评论添加成功'
    }
  } catch (error) {
    console.error('添加评论失败:', error)
    return {
      code: 500,
      message: '添加评论失败'
    }
  }
}