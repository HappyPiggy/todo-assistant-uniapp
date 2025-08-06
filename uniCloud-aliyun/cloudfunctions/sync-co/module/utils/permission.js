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
  
  // 记录函数调用
  console.log('[Permission Check] Starting check:', {
    userId,
    todoBookId,
    permission,
    timestamp: new Date().toISOString()
  })
  
  // 参数验证
  if (!userId || typeof userId !== 'string') {
    console.error('[Permission Check] Invalid userId:', userId)
    return {
      success: false,
      error: {
        code: 400,
        message: '无效的用户ID'
      }
    }
  }
  
  if (!todoBookId || typeof todoBookId !== 'string') {
    console.error('[Permission Check] Invalid todoBookId:', todoBookId)
    return {
      success: false,
      error: {
        code: 400,
        message: '无效的项目册ID'
      }
    }
  }
  
  const validPermissions = ['read', 'write', 'delete']
  if (!permission || !validPermissions.includes(permission)) {
    console.error('[Permission Check] Invalid permission:', permission)
    return {
      success: false,
      error: {
        code: 400,
        message: '无效的权限类型，必须是: read, write, delete'
      }
    }
  }
  
  try {
    // 获取项目册信息
    console.log('[Permission Check] Fetching TodoBook:', todoBookId)
    const bookRes = await db.collection('todobooks').doc(todoBookId).get()
    
    if (!bookRes.data || bookRes.data.length === 0) {
      console.log('[Permission Check] TodoBook not found:', todoBookId)
      return {
        success: false,
        error: {
          code: 404,
          message: 'TodoBook 不存在'
        }
      }
    }
    
    const book = bookRes.data[0]
    console.log('[Permission Check] TodoBook found:', {
      _id: book._id,
      creator_id: book.creator_id,
      is_archived: book.is_archived,
      members_count: book.members ? book.members.length : 0
    })
    
    // 确保必要字段存在
    if (!book.creator_id) {
      console.error('[Permission Check] TodoBook missing creator_id:', book._id)
      return {
        success: false,
        error: {
          code: 500,
          message: '项目册数据异常：缺少创建者信息'
        }
      }
    }
    
    // 设置默认值
    const isArchived = book.is_archived === true // 确保是布尔值
    
    // 检查是否是创建者
    const isOwner = book.creator_id === userId
    console.log('[Permission Check] Is owner:', isOwner)
    
    if (isOwner) {
      // 创建者拥有所有权限，除非是归档项目的写操作
      if (isArchived && permission === 'write') {
        console.log('[Permission Check] Denied: Cannot write to archived book (owner)')
        return {
          success: false,
          error: {
            code: 403,
            message: '归档项目册不能进行修改操作'
          }
        }
      }
      
      console.log('[Permission Check] Granted: Owner has permission')
      return { success: true, book: book }
    }
    
    // 检查是否是成员
    const members = Array.isArray(book.members) ? book.members : []
    const isMember = members.some(m => {
      // 确保成员对象和user_id字段存在
      return m && m.user_id && m.user_id === userId
    })
    
    console.log('[Permission Check] Is member:', isMember)
    
    if (!isMember) {
      console.log('[Permission Check] Denied: User is not a member')
      return {
        success: false,
        error: {
          code: 403,
          message: '无权限访问此 TodoBook'
        }
      }
    }
    
    // 成员权限检查
    // 成员不能删除项目册
    if (permission === 'delete') {
      console.log('[Permission Check] Denied: Members cannot delete')
      return {
        success: false,
        error: {
          code: 403,
          message: '只有创建者可以删除项目册'
        }
      }
    }
    
    // 成员不能对归档项目进行写操作
    if (isArchived && permission === 'write') {
      console.log('[Permission Check] Denied: Cannot write to archived book (member)')
      return {
        success: false,
        error: {
          code: 403,
          message: '归档项目册不能进行修改操作'
        }
      }
    }
    
    // 成员有读写权限（非归档情况下）
    console.log('[Permission Check] Granted: Member has permission')
    return { success: true, book: book }
    
  } catch (error) {
    console.error('[Permission Check] Unexpected error:', {
      error: error.message,
      stack: error.stack,
      userId,
      todoBookId,
      permission
    })
    return {
      success: false,
      error: {
        code: 500,
        message: '权限检查失败: ' + error.message
      }
    }
  }
}

module.exports = {
  checkTodoBookPermission
}