/**
 * 获取分享预览信息
 */

module.exports = async function getSharePreview(shareCode) {
  try {
    const db = this.db
    
    // 1. 验证分享码格式
    if (!/^[A-Z0-9]{6}$/.test(shareCode)) {
      return {
        code: 1001,
        message: '请输入正确格式的分享码（6位大写字母+数字）'
      }
    }
    
    // 2. 查找分享记录 (不区分大小写)
    const shareCollection = db.collection('todobook_shares')
    const shareResult = await shareCollection.where({
      share_code: db.RegExp({
        regexp: '^' + shareCode.toUpperCase() + '$',
        options: 'i'
      })
    }).get()
    
    if (shareResult.data.length === 0) {
      return {
        code: 1002,
        message: '分享码不存在或已失效'
      }
    }
    
    const shareRecord = shareResult.data[0]
    const sharedTodoBookId = shareRecord.shared_todobook_id
    
    // 3. 获取分享模板项目册基本信息
    const bookCollection = db.collection('todobooks')
    const templateBookResult = await bookCollection.doc(sharedTodoBookId).get()
    
    if (templateBookResult.data.length === 0) {
      return {
        code: 1003,
        message: '分享的项目册不存在'
      }
    }
    
    const templateBook = templateBookResult.data[0]
    
    // 4. 统计任务数量
    const taskCollection = db.collection('todoitems')
    const taskCountResult = await taskCollection.where({
      todobook_id: sharedTodoBookId
    }).count()
    
    // 5. 获取分享创建者信息
    const userCollection = db.collection('uni-id-users')
    const creatorResult = await userCollection.doc(shareRecord.creator_id).field({
      nickname: true,
      username: true
    }).get()
    
    let creatorName = '未知用户'
    if (creatorResult.data.length > 0) {
      const creator = creatorResult.data[0]
      creatorName = creator.nickname || creator.username || '未知用户'
    }
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        todobook_name: templateBook.title,
        todobook_description: templateBook.description || '',
        todobook_icon: templateBook.icon || 'folder',
        todobook_color: templateBook.color || '#007AFF',
        task_count: taskCountResult.total,
        include_comments: shareRecord.include_comments,
        creator_name: creatorName,
        share_count: shareRecord.share_count || 0,
        created_at: shareRecord.created_at
      }
    }
    
  } catch (error) {
    console.error('获取分享预览失败:', error)
    return {
      code: 1000,
      message: '获取分享预览失败: ' + error.message
    }
  }
}