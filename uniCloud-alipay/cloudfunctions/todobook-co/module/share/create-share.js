/**
 * 创建项目册分享
 */

const { generateUniqueShareCode } = require('./utils/share-code-generator')
const { cloneTodoBook } = require('./utils/todobook-cloner')

module.exports = async function createShare({ todBookId, includeComments = false }) {
  try {
    const db = this.db
    const userId = this.uid
    
    // 1. 验证项目册存在并且用户有权限
    const bookCollection = db.collection('todobooks')
    const bookResult = await bookCollection.where({
      _id: todBookId,
      creator_id: userId
    }).get()
    
    if (bookResult.data.length === 0) {
      return {
        code: 1001,
        message: '项目册不存在或无权限'
      }
    }
    
    const originalBook = bookResult.data[0]
    
    // 2. 检查该项目册是否已经被分享过
    const shareCollection = db.collection('todobook_shares')
    const existingShareResult = await shareCollection.where({
      creator_id: userId
    }).get()
    
    // 检查是否有同一项目册的分享
    for (const share of existingShareResult.data) {
      // 获取已分享的项目册信息，检查是否为同一原始项目册
      const sharedBookResult = await bookCollection.where({
        _id: share.shared_todobook_id
      }).get()
      
      if (sharedBookResult.data.length > 0) {
        const sharedBook = sharedBookResult.data[0]
        // 如果是从同一原始项目册创建的分享模板，则不允许重复分享
        if (sharedBook.original_todobook_id === todBookId) {
          return {
            code: 1003,
            message: '已分享此项目册，无法再次分享。请先删除已有分享。'
          }
        }
      }
    }
    
    // 3. 检查用户分享数量限制（最多2个）
    if (existingShareResult.total >= 2) {
      return {
        code: 1002,
        message: '最多只能同时分享2个项目册，请先删除现有分享'
      }
    }
    
    // 4. 生成唯一分享码
    const shareCode = await generateUniqueShareCode(db)
    
    // 5. 创建分享模板项目册
    const sharedBookId = await cloneTodoBook(db, todBookId, {
      includeComments,
      isTemplate: true,
      templateCreatorId: userId
    })
    
    // 6. 创建分享记录
    const shareData = {
      share_code: shareCode,
      creator_id: userId,
      shared_todobook_id: sharedBookId,
      include_comments: includeComments,
      share_count: 0,
      created_at: new Date()
    }
    
    const shareResult = await shareCollection.add(shareData)
    
    return {
      code: 0,
      message: '分享创建成功',
      data: {
        share_code: shareCode,
        share_id: shareResult.id
      }
    }
    
  } catch (error) {
    console.error('创建分享失败:', error)
    return {
      code: 1000,
      message: '创建分享失败: ' + error.message
    }
  }
}