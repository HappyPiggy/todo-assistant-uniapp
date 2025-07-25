/**
 * 删除项目册分享
 */

module.exports = async function deleteShare({ shareId }) {
  try {
    const db = this.db
    const userId = this.uid
    
    // 1. 验证分享记录存在并且用户有权限
    const shareCollection = db.collection('todobook_shares')
    const shareResult = await shareCollection.where({
      _id: shareId,
      creator_id: userId
    }).get()
    
    if (shareResult.data.length === 0) {
      return {
        code: 1001,
        message: '分享记录不存在或无权限'
      }
    }
    
    const shareRecord = shareResult.data[0]
    const sharedTodoBookId = shareRecord.shared_todobook_id
    
    // 2. 删除云端分享模板项目册及相关数据
    const bookCollection = db.collection('todobooks')
    const taskCollection = db.collection('todoitems')
    const commentCollection = db.collection('todoitems_comments')
    
    // 删除分享模板项目册的所有评论
    await commentCollection.where({
      todobook_id: sharedTodoBookId
    }).remove()
    
    // 删除分享模板项目册的所有任务
    await taskCollection.where({
      todobook_id: sharedTodoBookId
    }).remove()
    
    // 删除分享模板项目册
    await bookCollection.doc(sharedTodoBookId).remove()
    
    // 3. 删除分享记录
    await shareCollection.doc(shareId).remove()
    
    return {
      code: 0,
      message: '分享已删除'
    }
    
  } catch (error) {
    console.error('删除分享失败:', error)
    return {
      code: 1000,
      message: '删除分享失败: ' + error.message
    }
  }
}