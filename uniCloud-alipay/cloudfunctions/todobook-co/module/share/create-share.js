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
    
    // 先尝试通过ID直接获取项目册（支持归档项目册）
    let bookResult
    try {
      bookResult = await bookCollection.doc(todBookId).get()
      console.log('通过doc查询项目册 - 查询结果:', bookResult)
    } catch (docError) {
      console.log('doc查询失败，尝试where查询:', docError)
      // 如果doc查询失败，回退到where查询
      bookResult = await bookCollection.where({
        _id: todBookId,
        creator_id: userId
      }).get()
      console.log('通过where查询项目册 - 查询结果:', bookResult)
    }
    
    // 检查项目册是否存在
    let originalBook
    if (bookResult.data && bookResult.data.length > 0) {
      originalBook = bookResult.data[0]
    } else if (bookResult.data) {
      // doc查询的情况
      originalBook = bookResult.data
    }
    
    if (!originalBook || !originalBook._id) {
      console.log('项目册不存在 - 查询条件:', { _id: todBookId, creator_id: userId })
      console.log('查询结果:', bookResult)
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