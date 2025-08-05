/**
 * 检查项目册的分享状态
 */

module.exports = async function checkShareStatus(params) {
  try {
    const db = this.db
    const userId = this.uid
    
    console.log('checkShareStatus 接收到的参数:', params)
    
    // 处理参数：如果是对象则提取todoBookId，如果是字符串则直接使用
    const todoBookId = typeof params === 'object' && params.todoBookId ? params.todoBookId : params
    
    console.log('解析后的todoBookId:', { todoBookId: todoBookId, type: typeof todoBookId })
    
    if (!todoBookId) {
      return {
        code: 1001,
        message: '项目册ID不能为空'
      }
    }
    
    // 1. 验证项目册存在并且用户有权限
    const bookCollection = db.collection('todobooks')
    
    // 先尝试通过ID直接获取项目册（与createShare保持一致）
    let bookResult
    try {
      bookResult = await bookCollection.doc(todoBookId).get()
      console.log('通过doc查询项目册 - 查询结果:', bookResult)
    } catch (docError) {
      console.log('doc查询失败，尝试where查询:', docError)
      // 如果doc查询失败，回退到where查询
      bookResult = await bookCollection.where({
        _id: todoBookId,
        creator_id: userId
      }).get()
      console.log('通过where查询项目册 - 查询结果:', bookResult)
    }
    
    // 检查项目册是否存在
    let originalBook
    if (bookResult.data && Array.isArray(bookResult.data) && bookResult.data.length > 0) {
      // where查询或doc查询返回数组的情况
      originalBook = bookResult.data[0]
    } else if (bookResult.data && !Array.isArray(bookResult.data)) {
      // doc查询返回单个对象的情况
      originalBook = bookResult.data
    }
    
    if (!originalBook || !originalBook._id) {
      console.log('项目册不存在 - 查询条件:', { _id: todoBookId, creator_id: userId })
      console.log('查询结果:', bookResult)
      console.log('解析后的originalBook:', originalBook)
      return {
        code: 1001,
        message: '项目册不存在'
      }
    }
    
    // 验证权限：确保当前用户是项目册的创建者
    if (originalBook.creator_id !== userId) {
      console.log('权限验证失败 - 项目册创建者:', originalBook.creator_id, '当前用户:', userId)
      return {
        code: 1001,
        message: '无权限操作此项目册'
      }
    }
    
    console.log('项目册权限检查通过 - 项目册信息:', {
      id: originalBook._id,
      title: originalBook.title,
      is_archived: originalBook.is_archived,
      creator_id: originalBook.creator_id
    })
    
    // 2. 检查是否有该项目册的分享记录
    const shareCollection = db.collection('todobook_shares')
    const shareResult = await shareCollection.where({
      creator_id: userId
    }).get()
    
    // 查找是否有从该项目册创建的分享
    let shareInfo = null
    for (const share of shareResult.data) {
      // 获取分享模板项目册信息
      const sharedBookResult = await bookCollection.where({
        _id: share.shared_todobook_id
      }).get()
      
      if (sharedBookResult.data.length > 0) {
        const sharedBook = sharedBookResult.data[0]
        // 检查是否为同一原始项目册
        if (sharedBook.original_todobook_id === todoBookId) {
          shareInfo = share
          break
        }
      }
    }
    
    // 3. 如果没有找到分享，返回未分享状态
    if (!shareInfo) {
      return {
        code: 0,
        data: {
          isShared: false,
          shareInfo: null
        }
      }
    }
    
    // 4. 计算是否可以同步（24小时限制）
    const now = new Date()
    const lastSyncAt = shareInfo.last_sync_at ? new Date(shareInfo.last_sync_at) : null
    let canSync = true
    let nextSyncTime = null
    
    if (lastSyncAt) {
      const timeDiff = now.getTime() - lastSyncAt.getTime()
      const hoursDiff = timeDiff / (1000 * 60 * 60)
      
      if (hoursDiff < 24) {
        canSync = false
        // 计算下次可同步时间
        nextSyncTime = new Date(lastSyncAt.getTime() + 24 * 60 * 60 * 1000)
      }
    }
    
    // 5. 返回分享状态信息
    return {
      code: 0,
      data: {
        isShared: true,
        shareInfo: {
          shareId: shareInfo._id,
          shareCode: shareInfo.share_code,
          lastSyncAt: shareInfo.last_sync_at || null,
          syncCount: shareInfo.sync_count || 0,
          canSync: canSync,
          nextSyncTime: nextSyncTime
        }
      }
    }
    
  } catch (error) {
    console.error('检查分享状态失败:', error)
    return {
      code: 1000,
      message: '检查分享状态失败: ' + error.message
    }
  }
}