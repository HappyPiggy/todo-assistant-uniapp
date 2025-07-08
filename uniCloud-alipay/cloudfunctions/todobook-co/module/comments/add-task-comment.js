/**
 * 添加任务评论
 */
module.exports = async function addTaskComment(params) {
  const { taskId, content, parentCommentId = null } = params
  
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
      .where({ _id: uid })
      .field({
        nickname: true,
        avatar_file: true,
        username: true,
        mobile: true,
        email: true
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
    
    // 优先级：昵称 > 用户名 > 手机号脱敏 > 邮箱前缀 > 默认值
    let displayName = '用户'
    if (user.nickname && user.nickname.trim()) {
      displayName = user.nickname.trim()
    } else if (user.username && user.username.trim()) {
      displayName = user.username.trim()
    } else if (user.mobile) {
      displayName = user.mobile.substring(0, 3) + '****' + user.mobile.substring(7)
    } else if (user.email) {
      displayName = user.email.split('@')[0]
    }
    
    newComment.user_nickname = displayName
    newComment.user_avatar = user.avatar_file || ''
    

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