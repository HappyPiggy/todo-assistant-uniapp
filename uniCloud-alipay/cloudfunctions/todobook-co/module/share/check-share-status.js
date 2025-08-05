/**
 * 检查项目册的分享状态
 */

module.exports = async function checkShareStatus({ todoBookId }) {
  try {
    const db = this.db
    const userId = this.uid
    
    if (!todoBookId) {
      return {
        code: 1001,
        message: '项目册ID不能为空'
      }
    }
    
    // 1. 验证项目册存在并且用户有权限
    const bookCollection = db.collection('todobooks')
    const bookResult = await bookCollection.where({
      _id: todoBookId,
      creator_id: userId
    }).get()
    
    if (!bookResult.data || bookResult.data.length === 0) {
      return {
        code: 1001,
        message: '项目册不存在或无权限'
      }
    }
    
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