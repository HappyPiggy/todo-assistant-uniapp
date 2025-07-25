/**
 * 通过分享码导入项目册
 */

const { cloneTodoBook } = require('./utils/todobook-cloner')

module.exports = async function importByCode({ shareCode }) {
  try {
    const db = this.db
    const userId = this.uid
    
    // 1. 验证分享码格式
    if (!/^[A-Za-z0-9]{6}$/.test(shareCode)) {
      return {
        code: 1001,
        message: '请输入正确格式的分享码'
      }
    }
    
    // 2. 查找分享记录
    const shareCollection = db.collection('todobook_shares')
    const shareResult = await shareCollection.where({
      share_code: shareCode
    }).get()
    
    if (shareResult.data.length === 0) {
      return {
        code: 1002,
        message: '分享码不存在或已失效'
      }
    }
    
    const shareRecord = shareResult.data[0]
    const sharedTodoBookId = shareRecord.shared_todobook_id
    
    // 3. 获取分享模板项目册信息
    const bookCollection = db.collection('todobooks')
    const templateBookResult = await bookCollection.doc(sharedTodoBookId).get()
    
    if (templateBookResult.data.length === 0) {
      return {
        code: 1003,
        message: '分享的项目册不存在'
      }
    }
    
    const templateBook = templateBookResult.data[0]
    
    // 4. 防止用户导入自己的分享
    if (shareRecord.creator_id === userId) {
      return {
        code: 1004,
        message: '不能导入自己创建的分享'
      }
    }
    
    // 5. 克隆分享模板为新项目册
    const newBookId = await cloneTodoBook(db, sharedTodoBookId, {
      includeComments: shareRecord.include_comments,
      isTemplate: false,
      newCreatorId: userId,
      titleSuffix: '（来自分享）'
    })
    
    // 6. 更新分享统计
    await shareCollection.doc(shareRecord._id).update({
      share_count: db.command.inc(1),
      last_import_at: new Date()
    })
    
    return {
      code: 0,
      message: '导入成功',
      data: {
        todobook_id: newBookId,
        todobook_name: templateBook.title + '（来自分享）'
      }
    }
    
  } catch (error) {
    console.error('导入分享失败:', error)
    return {
      code: 1000,
      message: '导入分享失败: ' + error.message
    }
  }
}