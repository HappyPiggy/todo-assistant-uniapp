/**
 * 同步分享的项目册内容
 */

const { cloneTodoBook } = require('./utils/todobook-cloner')

module.exports = async function syncShare(params) {
  try {
    const db = this.db
    const userId = this.uid
    
    console.log('syncShare 接收到的参数:', params)
    
    // 处理参数：如果是对象则提取shareId，如果是字符串则直接使用
    const shareId = typeof params === 'object' && params.shareId ? params.shareId : params
    
    console.log('解析后的shareId:', { shareId: shareId, type: typeof shareId })
    
    if (!shareId) {
      return {
        code: 1001,
        message: '分享ID不能为空'
      }
    }
    
    // 1. 获取分享记录
    const shareCollection = db.collection('todobook_shares')
    const shareResult = await shareCollection.doc(shareId).get()
    
    console.log('分享记录查询结果:', shareResult)
    
    // 处理doc查询结果格式
    let shareData
    if (shareResult.data && Array.isArray(shareResult.data) && shareResult.data.length > 0) {
      // doc查询返回数组的情况
      shareData = shareResult.data[0]
    } else if (shareResult.data && !Array.isArray(shareResult.data)) {
      // doc查询返回单个对象的情况
      shareData = shareResult.data
    }
    
    if (!shareData || !shareData._id) {
      return {
        code: 2002,
        message: '分享记录不存在'
      }
    }
    
    // 2. 验证权限
    if (shareData.creator_id !== userId) {
      return {
        code: 2003,
        message: '无权限同步此分享'
      }
    }
    
    // 3. 检查同步时间限制（24小时）
    const now = new Date()
    const lastSyncAt = shareData.last_sync_at ? new Date(shareData.last_sync_at) : null
    
    if (lastSyncAt) {
      const timeDiff = now.getTime() - lastSyncAt.getTime()
      const hoursDiff = timeDiff / (1000 * 60 * 60)
      
      if (hoursDiff < 24) {
        const nextSyncTime = new Date(lastSyncAt.getTime() + 24 * 60 * 60 * 1000)
        return {
          code: 2001,
          message: `同步频率限制，请在 ${Math.ceil(24 - hoursDiff)} 小时后重试`,
          data: {
            nextSyncTime: nextSyncTime
          }
        }
      }
    }
    
    // 4. 获取分享模板项目册信息
    const bookCollection = db.collection('todobooks')
    const sharedBookResult = await bookCollection.doc(shareData.shared_todobook_id).get()
    
    // 处理doc查询结果格式
    let sharedBook
    if (sharedBookResult.data && Array.isArray(sharedBookResult.data) && sharedBookResult.data.length > 0) {
      sharedBook = sharedBookResult.data[0]
    } else if (sharedBookResult.data && !Array.isArray(sharedBookResult.data)) {
      sharedBook = sharedBookResult.data
    }
    
    if (!sharedBook || !sharedBook._id) {
      return {
        code: 2004,
        message: '分享模板项目册不存在'
      }
    }
    const originalBookId = sharedBook.original_todobook_id
    
    if (!originalBookId) {
      return {
        code: 2004,
        message: '无法找到原始项目册ID'
      }
    }
    
    // 5. 验证原始项目册是否存在
    const originalBookResult = await bookCollection.doc(originalBookId).get()
    
    // 处理doc查询结果格式
    let originalBook
    if (originalBookResult.data && Array.isArray(originalBookResult.data) && originalBookResult.data.length > 0) {
      originalBook = originalBookResult.data[0]
    } else if (originalBookResult.data && !Array.isArray(originalBookResult.data)) {
      originalBook = originalBookResult.data
    }
    
    if (!originalBook || !originalBook._id) {
      return {
        code: 2002,
        message: '原始项目册已被删除，无法同步'
      }
    }
    
    // 6. 开始同步过程
    try {
      // 删除旧的分享模板内容（任务、子任务、评论）
      const taskCollection = db.collection('todoitems')
      const commentCollection = db.collection('todoitem_comments')
      
      // 如果包含评论，先获取所有任务ID以便删除评论
      if (shareData.include_comments) {
        const oldTasksResult = await taskCollection.where({
          todobook_id: shareData.shared_todobook_id
        }).field({ _id: true }).get()
        
        const oldTaskIds = oldTasksResult.data.map(task => task._id)
        
        if (oldTaskIds.length > 0) {
          await commentCollection.where({
            task_id: db.command.in(oldTaskIds)
          }).remove()
        }
      }
      
      // 删除旧任务
      await taskCollection.where({
        todobook_id: shareData.shared_todobook_id
      }).remove()
      
      // 使用 cloneTodoBook 工具克隆最新内容
      // 注意：这里我们需要更新现有的分享模板，而不是创建新的
      await cloneTodoBook(db, originalBookId, {
        includeComments: shareData.include_comments,
        isTemplate: true,
        templateCreatorId: userId,
        targetBookId: shareData.shared_todobook_id, // 指定目标项目册ID
        updateExisting: true // 标记为更新现有项目册
      })
      
      // 更新分享记录的同步信息
      await shareCollection.doc(shareId).update({
        last_sync_at: now,
        sync_count: db.command.inc(1)
      })
      
      return {
        code: 0,
        message: '同步成功',
        data: {
          syncedAt: now
        }
      }
      
    } catch (error) {
      throw error
    }
    
  } catch (error) {
    console.error('同步分享失败:', error)
    return {
      code: 2004,
      message: '同步失败: ' + error.message
    }
  }
}