/**
 * 获取任务评论列表（分页）
 */
module.exports = async function getTaskComments(params) {
  const { taskId, page = 1, pageSize = 20 } = params
  const { db, userInfo, uid } = this
  
  // 参数验证
  if (!taskId) {
    return {
      code: 400,
      message: '任务ID不能为空'
    }
  }
  
  let validPage = Math.max(1, parseInt(page) || 1)
  let validPageSize = Math.min(50, Math.max(1, parseInt(pageSize) || 20))

  try {
    // 获取任务及其评论
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

    // 过滤已删除的评论，并添加用户信息
    const activeComments = []
    for (let comment of comments) {
      if (!comment.is_deleted) {
        // 获取评论者信息
        try {
          const userResult = await db.collection('uni-id-users')
            .doc(comment.user_id)
            .field({
              nickname: true,
              avatar: true,
              username: true
            })
            .get()
          
          if (userResult.data.length > 0) {
            const user = userResult.data[0]
            comment.user_nickname = user.nickname || user.username || '用户'
            comment.user_avatar = user.avatar || ''
          } else {
            comment.user_nickname = '用户'
            comment.user_avatar = ''
          }
        } catch (error) {
          comment.user_nickname = '用户'
          comment.user_avatar = ''
        }
        
        // 确保有唯一ID（使用创建时间戳）
        if (!comment._id) {
          comment._id = comment.created_at.getTime().toString()
        }
        
        activeComments.push(comment)
      }
    }

    // 分离顶级评论和回复
    const topLevelComments = activeComments.filter(c => !c.reply_to)
    const replies = activeComments.filter(c => c.reply_to)

    // 按时间倒序排列顶级评论（最新在前）
    topLevelComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // 将回复添加到对应的顶级评论
    topLevelComments.forEach(comment => {
      comment.replies = replies
        .filter(reply => reply.reply_to === comment._id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // 回复按时间正序
    })

    // 分页处理
    const total = topLevelComments.length
    const startIndex = (validPage - 1) * validPageSize
    const endIndex = startIndex + validPageSize
    const paginatedComments = topLevelComments.slice(startIndex, endIndex)

    return {
      code: 0,
      data: {
        comments: paginatedComments,
        total: total,
        page: validPage,
        pageSize: validPageSize,
        hasMore: endIndex < total
      }
    }
  } catch (error) {
    console.error('获取评论列表失败:', error)
    return {
      code: 500,
      message: '获取评论列表失败'
    }
  }
}