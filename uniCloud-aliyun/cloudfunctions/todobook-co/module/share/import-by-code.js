/**
 * 通过分享码导入项目册
 */

const { cloneTodoBook } = require('./utils/todobook-cloner')

module.exports = async function importByCode(shareCode, allowDuplicate = false) {
  
  try {
    const db = this.db
    const userId = this.uid
    
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
      share_code: new db.RegExp('^' + shareCode.toUpperCase() + '$', 'i')
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
    
    // 5. 检查是否已经导入过该分享（如果不允许重复）
    if (!allowDuplicate) {
      const existingImports = await bookCollection.where({
        creator_id: userId,
        imported_from_share_id: shareRecord._id
      }).get()
      
      if (existingImports.data.length > 0) {
        const existingBook = existingImports.data[0]
        return {
          code: 1005,
          message: '您已经导入过这个分享项目册',
          data: {
            existingBook: {
              id: existingBook._id,
              title: existingBook.title,
              created_at: existingBook.created_at
            },
            allowDuplicate: true
          }
        }
      }
    }
    
    // 6. 克隆分享模板为新项目册
    const titleSuffix = allowDuplicate ? '（来自分享）' : '（来自分享）'
    const newBookId = await cloneTodoBook(db, sharedTodoBookId, {
      includeComments: shareRecord.include_comments,
      isTemplate: false,
      newCreatorId: userId,
      titleSuffix: titleSuffix
    })
    
    // 验证克隆结果的数据完整性
    try {
      const taskCollection = db.collection('todoitems')
      const importedTasksResult = await taskCollection.where({
        todobook_id: newBookId
      }).get()
      
      const importedParentTasks = importedTasksResult.data.filter(task => !task.parent_id)
      const importedChildTasks = importedTasksResult.data.filter(task => task.parent_id)
      
      
      // 验证子任务的父子关系是否正确
      let validChildTasks = 0
      let invalidChildTasks = 0
      
      importedChildTasks.forEach(childTask => {
        const parentExists = importedParentTasks.some(parent => parent._id === childTask.parent_id)
        if (parentExists) {
          validChildTasks++
        } else {
          invalidChildTasks++
          console.error(`🔍 [导入验证] 发现无效子任务: ${childTask._id} (${childTask.title}) 的父任务 ${childTask.parent_id} 不存在`)
        }
      })
      
      
    } catch (verifyError) {
      console.error('🔍 [导入验证] 验证导入结果时出错:', verifyError)
    }
    
    // 7. 为导入的项目册添加来源标记
    
    const updateResult = await bookCollection.doc(newBookId).update({
      imported_from_share_id: shareRecord._id
    })
    
    
    // 8. 更新分享统计
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