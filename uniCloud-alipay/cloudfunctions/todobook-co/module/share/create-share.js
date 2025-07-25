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
    
    // 2. 检查用户分享数量限制（最多2个）
    const shareCollection = db.collection('todobook_shares')
    const userSharesResult = await shareCollection.where({
      creator_id: userId
    }).count()
    
    if (userSharesResult.total >= 2) {
      return {
        code: 1002,
        message: '最多只能同时分享2个项目册，请先删除现有分享'
      }
    }
    
    // 3. 生成唯一分享码
    const shareCode = await generateUniqueShareCode(db)
    
    // 4. 创建分享模板项目册
    const sharedBookId = await cloneTodoBook(db, todBookId, {
      includeComments,
      isTemplate: true,
      templateCreatorId: userId
    })
    
    // 5. 创建分享记录
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