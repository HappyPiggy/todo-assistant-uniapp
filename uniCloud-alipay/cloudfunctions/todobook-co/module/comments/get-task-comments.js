/**
 * 获取任务评论列表（分页）
 */
module.exports = async function getTaskComments(params) {
  const { taskId, page = 1, pageSize = 20 } = params
  
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

    // 过滤已删除的评论
    const activeComments = comments.filter(comment => !comment.is_deleted)
    
    // 批量获取用户信息
    if (activeComments.length > 0) {
      // 收集所有用户ID
      const userIds = [...new Set(activeComments.map(comment => comment.user_id))]
      
      try {
        // 批量查询用户信息
        const usersResult = await db.collection('uni-id-users')
          .where({
            _id: db.command.in(userIds)
          })
          .field({
            _id: true,
            nickname: true,
            avatar_file: true,
            username: true,
            mobile: true,
            email: true
          })
          .get()
        
        // 创建用户信息映射
        const userMap = {}
        usersResult.data.forEach(user => {
          userMap[user._id] = {
            nickname: user.nickname,
            avatar_file: user.avatar_file,
            username: user.username,
            mobile: user.mobile,
            email: user.email
          }
        })
        
        // 为评论添加用户信息
        activeComments.forEach(comment => {
          const user = userMap[comment.user_id]
          if (user) {
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
            
            comment.user_nickname = displayName
            comment.user_avatar = user.avatar_file || ''
            
          } else {
            comment.user_nickname = '用户'
            comment.user_avatar = ''
          }
          
          // 确保有唯一ID（使用创建时间戳）
          if (!comment._id) {
            comment._id = comment.created_at.getTime().toString()
          }
        })
      } catch (error) {
        console.error('批量获取用户信息失败:', error)
        // 如果批量查询失败，为所有评论设置默认值
        activeComments.forEach(comment => {
          comment.user_nickname = '用户'
          comment.user_avatar = ''
          if (!comment._id) {
            comment._id = comment.created_at.getTime().toString()
          }
        })
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