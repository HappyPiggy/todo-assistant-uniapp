// 权限检查工具函数

/**
 * 检查项目册权限
 * @param {Object} context 云函数上下文
 * @param {string} userId 用户ID
 * @param {string} todoBookId 项目册ID
 * @param {string} permission 权限类型 ('read' | 'write' | 'delete')
 * @returns {Object} 权限检查结果 { success: boolean, error?: Object, book?: Object }
 */
async function checkTodoBookPermission(context, userId, todoBookId, permission) {
  const db = context.db
  
  try {
    // 获取项目册信息
    const bookRes = await db.collection('todo-books').doc(todoBookId).get()
    if (!bookRes.data || bookRes.data.length === 0) {
      return {
        success: false,
        error: {
          code: 404,
          message: 'TodoBook 不存在'
        }
      }
    }
    
    const book = bookRes.data[0]
    
    // 检查是否是创建者
    if (book.user_id === userId) {
      // 检查归档状态：如果是写操作且项目册已归档，则拒绝
      if (book.is_archived && permission === 'write') {
        return {
          success: false,
          error: {
            code: 403,
            message: '归档项目册不能进行修改操作'
          }
        }
      }
      
      return { success: true, book: book } // 创建者拥有所有权限（除非归档状态限制）
    }
    
    // 检查是否是成员
    const isMember = book.members && book.members.some(m => m.user_id === userId)
    
    if (!isMember) {
      return {
        success: false,
        error: {
          code: 403,
          message: '无权限访问此 TodoBook'
        }
      }
    }
    
    // 检查归档状态：如果是写操作且项目册已归档，则拒绝
    if (book.is_archived && permission === 'write') {
      return {
        success: false,
        error: {
          code: 403,
          message: '归档项目册不能进行修改操作'
        }
      }
    }
    
    // 成员默认有读写权限（除了删除权限只有创建者有）
    if (permission === 'delete') {
      return {
        success: false,
        error: {
          code: 403,
          message: '只有创建者可以删除项目册'
        }
      }
    }
    
    return { success: true, book: book }
    
  } catch (error) {
    console.error('权限检查失败:', error)
    return {
      success: false,
      error: {
        code: 500,
        message: '权限检查失败'
      }
    }
  }
}

module.exports = {
  checkTodoBookPermission
}