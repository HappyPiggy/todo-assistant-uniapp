/**
 * 修复已导入TodoBook中的评论ID问题
 * 这个脚本用于修复已经导入但评论ID没有正确更新的TodoBook
 */

/**
 * 修复已导入TodoBook的评论ID
 * @param {object} db - 数据库对象
 * @returns {Promise<object>} 修复结果统计
 */
async function fixImportedCommentIds(db) {
  console.log('🔧 [历史数据修复] 开始修复已导入TodoBook的评论ID问题')
  
  let stats = {
    totalBooks: 0,
    processedBooks: 0,
    totalTasks: 0,
    processedTasks: 0,
    totalComments: 0,
    fixedComments: 0,
    errors: []
  }
  
  try {
    // 1. 查找所有导入的TodoBook
    const bookCollection = db.collection('todobooks')
    const importedBooksResult = await bookCollection.where({
      imported_from_share_id: new db.RegExp('.+') // 存在 imported_from_share_id 字段
    }).get()
    
    stats.totalBooks = importedBooksResult.data.length
    console.log(`🔧 [历史数据修复] 找到 ${stats.totalBooks} 个已导入的TodoBook`)
    
    if (stats.totalBooks === 0) {
      console.log('🔧 [历史数据修复] 没有找到需要修复的导入TodoBook')
      return stats
    }
    
    // 2. 遍历每个导入的TodoBook
    for (const book of importedBooksResult.data) {
      console.log(`🔧 [历史数据修复] 处理TodoBook: ${book._id} (${book.title})`)
      
      try {
        // 查找该TodoBook下的所有任务
        const taskCollection = db.collection('todoitems')
        const tasksResult = await taskCollection.where({
          todobook_id: book._id
        }).get()
        
        stats.totalTasks += tasksResult.data.length
        console.log(`🔧 [历史数据修复] TodoBook ${book._id} 包含 ${tasksResult.data.length} 个任务`)
        
        // 3. 检查每个任务的评论
        for (const task of tasksResult.data) {
          if (!task.comments || !Array.isArray(task.comments) || task.comments.length === 0) {
            continue
          }
          
          stats.totalComments += task.comments.length
          let needsUpdate = false
          const commentIdMapping = new Map()
          
          // 检查评论ID是否需要修复
          const updatedComments = task.comments.map(comment => {
            const commentParts = comment._id.split('_')
            if (commentParts.length >= 3) {
              const commentTaskId = commentParts[0]
              
              // 如果评论ID中的任务ID与实际任务ID不匹配，需要修复
              if (commentTaskId !== task._id) {
                needsUpdate = true
                const timestamp = commentParts[1]
                const random = commentParts[2]
                const newCommentId = `${task._id}_${timestamp}_${random}`
                
                commentIdMapping.set(comment._id, newCommentId)
                console.log(`🔧 [历史数据修复] 修复评论ID: ${comment._id} -> ${newCommentId}`)
                
                return {
                  ...comment,
                  _id: newCommentId
                }
              }
            }
            
            return comment
          })
          
          // 如果需要更新，还要修复reply_to字段
          if (needsUpdate) {
            const finalComments = updatedComments.map(comment => {
              if (comment.reply_to && commentIdMapping.has(comment.reply_to)) {
                console.log(`🔧 [历史数据修复] 修复回复关系: ${comment.reply_to} -> ${commentIdMapping.get(comment.reply_to)}`)
                return {
                  ...comment,
                  reply_to: commentIdMapping.get(comment.reply_to)
                }
              }
              return comment
            })
            
            // 更新数据库
            await taskCollection.doc(task._id).update({
              comments: finalComments,
              updated_at: new Date()
            })
            
            stats.processedTasks++
            stats.fixedComments += commentIdMapping.size
            console.log(`🔧 [历史数据修复] 任务 ${task._id} 的评论ID修复完成，修复了 ${commentIdMapping.size} 条评论`)
          }
        }
        
        stats.processedBooks++
        
      } catch (taskError) {
        console.error(`🔧 [历史数据修复] 处理TodoBook ${book._id} 时出错:`, taskError)
        stats.errors.push({
          type: 'book_processing_error',
          bookId: book._id,
          error: taskError.message
        })
      }
    }
    
    // 输出修复统计
    console.log('🔧 [历史数据修复] 修复完成，统计结果：')
    console.log(`  - 总计导入TodoBook数量: ${stats.totalBooks}`)
    console.log(`  - 已处理TodoBook数量: ${stats.processedBooks}`)
    console.log(`  - 总计任务数量: ${stats.totalTasks}`)
    console.log(`  - 已处理任务数量: ${stats.processedTasks}`)
    console.log(`  - 总计评论数量: ${stats.totalComments}`)
    console.log(`  - 已修复评论数量: ${stats.fixedComments}`)
    console.log(`  - 错误数量: ${stats.errors.length}`)
    
    return stats
    
  } catch (error) {
    console.error('🔧 [历史数据修复] 修复过程中发生严重错误:', error)
    stats.errors.push({
      type: 'critical_error',
      error: error.message
    })
    throw error
  }
}

/**
 * 验证修复结果
 * @param {object} db - 数据库对象
 * @returns {Promise<object>} 验证结果
 */
async function verifyFixResults(db) {
  console.log('🔍 [修复验证] 开始验证修复结果')
  
  let verificationStats = {
    totalImportedBooks: 0,
    booksWithComments: 0,
    tasksWithBrokenCommentIds: 0,
    brokenComments: []
  }
  
  try {
    // 查找所有导入的TodoBook
    const bookCollection = db.collection('todobooks')
    const importedBooksResult = await bookCollection.where({
      imported_from_share_id: new db.RegExp('.+')
    }).get()
    
    verificationStats.totalImportedBooks = importedBooksResult.data.length
    
    for (const book of importedBooksResult.data) {
      const taskCollection = db.collection('todoitems')
      const tasksResult = await taskCollection.where({
        todobook_id: book._id
      }).get()
      
      for (const task of tasksResult.data) {
        if (!task.comments || !Array.isArray(task.comments) || task.comments.length === 0) {
          continue
        }
        
        verificationStats.booksWithComments++
        
        // 检查是否还有未修复的评论ID
        const brokenComments = task.comments.filter(comment => {
          const commentParts = comment._id.split('_')
          if (commentParts.length >= 3) {
            const commentTaskId = commentParts[0]
            return commentTaskId !== task._id
          }
          return false
        })
        
        if (brokenComments.length > 0) {
          verificationStats.tasksWithBrokenCommentIds++
          verificationStats.brokenComments.push({
            bookId: book._id,
            bookTitle: book.title,
            taskId: task._id,
            taskTitle: task.title,
            brokenCommentIds: brokenComments.map(c => c._id)
          })
        }
      }
    }
    
    console.log('🔍 [修复验证] 验证完成：')
    console.log(`  - 导入TodoBook总数: ${verificationStats.totalImportedBooks}`)
    console.log(`  - 包含评论的TodoBook数: ${verificationStats.booksWithComments}`)
    console.log(`  - 仍有问题的任务数: ${verificationStats.tasksWithBrokenCommentIds}`)
    
    if (verificationStats.tasksWithBrokenCommentIds > 0) {
      console.log('⚠️ [修复验证] 发现未修复的评论ID问题：')
      verificationStats.brokenComments.forEach(item => {
        console.log(`  - TodoBook: ${item.bookTitle} (${item.bookId})`)
        console.log(`    任务: ${item.taskTitle} (${item.taskId})`)
        console.log(`    问题评论ID: ${item.brokenCommentIds.join(', ')}`)
      })
    } else {
      console.log('✅ [修复验证] 所有评论ID都已正确修复')
    }
    
    return verificationStats
    
  } catch (error) {
    console.error('🔍 [修复验证] 验证过程中发生错误:', error)
    throw error
  }
}

module.exports = {
  fixImportedCommentIds,
  verifyFixResults
}