/**
 * 删除项目册分享
 */

module.exports = async function deleteShare(shareId) {
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
    
    // 注意：评论存储在任务文档的comments数组中，会随任务一起删除
    
    // 删除分享模板项目册的所有任务
    try {
      await taskCollection.where({
        todobook_id: sharedTodoBookId
      }).remove()
    } catch (error) {
      // 如果任务集合不存在或没有相关任务，忽略错误
      console.log('删除任务时遇到错误（可忽略）:', error.message)
    }
    
    // 删除分享模板项目册
    try {
      await bookCollection.doc(sharedTodoBookId).remove()
    } catch (error) {
      // 如果项目册不存在，忽略错误
      console.log('删除项目册时遇到错误（可忽略）:', error.message)
    }
    
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