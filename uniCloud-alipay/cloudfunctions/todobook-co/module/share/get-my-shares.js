/**
 * 获取我的分享列表
 */

module.exports = async function getMyShares() {
  try {
    const db = this.db
    const userId = this.uid
    
    // 1. 查询当前用户的分享记录
    const shareCollection = db.collection('todobook_shares')
    const shareResult = await shareCollection.where({
      creator_id: userId
    }).orderBy('created_at', 'desc').get()
    
    if (shareResult.data.length === 0) {
      return {
        code: 0,
        message: '获取成功',
        data: []
      }
    }
    
    // 2. 获取分享模板项目册信息
    const bookCollection = db.collection('todobooks')
    const shareList = []
    
    for (const shareRecord of shareResult.data) {
      // 通过shared_todobook_id关联查询分享模板项目册信息
      const bookResult = await bookCollection.doc(shareRecord.shared_todobook_id).get()
      
      if (bookResult.data.length > 0) {
        const sharedBook = bookResult.data[0]
        
        shareList.push({
          share_id: shareRecord._id,
          share_code: shareRecord.share_code,
          todobook_name: sharedBook.title,
          todobook_icon: sharedBook.icon || 'folder',
          todobook_description: sharedBook.description || '',
          todobook_color: sharedBook.color || '#007AFF',
          include_comments: shareRecord.include_comments,
          share_count: shareRecord.share_count || 0,
          created_at: shareRecord.created_at,
          last_import_at: shareRecord.last_import_at
        })
      }
    }
    
    return {
      code: 0,
      message: '获取成功',
      data: shareList
    }
    
  } catch (error) {
    console.error('获取分享列表失败:', error)
    return {
      code: 1000,
      message: '获取分享列表失败: ' + error.message
    }
  }
}