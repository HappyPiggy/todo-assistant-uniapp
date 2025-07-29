// 权限检查工具函数

const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')
const { createErrorResponse } = require('../../common/utils')

/**
 * 检查项目册权限
 * @param {Object} context 云函数上下文
 * @param {string} userId 用户ID
 * @param {string} todoBookId 项目册ID
 * @param {string} permission 权限类型
 * @returns {Object} 权限检查结果 { success: boolean, error?: Object, book?: Object }
 */
async function checkTodoBookPermission(context, userId, todoBookId, permission) {
  const db = context.db
  
  try {
    // 检查是否是项目册创建者并获取项目册信息
    const bookResult = await db.collection('todobooks')
      .where({ _id: todoBookId, creator_id: userId })
      .get()
    
    if (bookResult.data.length > 0) {
      const book = bookResult.data[0]
      
      // 检查归档状态：如果是写操作且项目册已归档，则拒绝
      if (book.is_archived && permission === PERMISSION_TYPE.WRITE) {
        return {
          success: false,
          error: createErrorResponse(ERROR_CODES.FORBIDDEN, '归档项目册不能进行修改操作')
        }
      }
      
      return { success: true, book: book } // 创建者拥有所有权限（除非归档状态限制）
    }
    
    // 检查成员权限
    const memberResult = await db.collection('todobook_members')
      .where({
        todobook_id: todoBookId,
        user_id: userId,
        is_active: true
      })
      .get()
    
    if (memberResult.data.length === 0) {
      return {
        success: false,
        error: createErrorResponse(ERROR_CODES.FORBIDDEN, '没有访问权限')
      }
    }
    
    const member = memberResult.data[0]
    
    // 获取项目册信息以检查归档状态
    const bookInfoResult = await db.collection('todobooks')
      .where({ _id: todoBookId })
      .get()
    
    if (bookInfoResult.data.length > 0) {
      const book = bookInfoResult.data[0]
      
      // 检查归档状态：如果是写操作且项目册已归档，则拒绝
      if (book.is_archived && permission === PERMISSION_TYPE.WRITE) {
        return {
          success: false,
          error: createErrorResponse(ERROR_CODES.FORBIDDEN, '归档项目册不能进行修改操作')
        }
      }
    }
    
    if (!member.permissions.includes(permission)) {
      const permissionMessages = {
        [PERMISSION_TYPE.READ]: '没有查看权限',
        [PERMISSION_TYPE.WRITE]: '没有编辑权限',
        [PERMISSION_TYPE.DELETE]: '没有删除权限',
        [PERMISSION_TYPE.MANAGE_MEMBERS]: '没有管理成员权限',
        [PERMISSION_TYPE.MANAGE_SETTINGS]: '没有管理设置权限'
      }
      
      return {
        success: false,
        error: createErrorResponse(ERROR_CODES.FORBIDDEN, permissionMessages[permission] || '没有权限')
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('权限检查失败:', error)
    return {
      success: false,
      error: createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '权限检查失败')
    }
  }
}

/**
 * 检查任务权限（通过项目册权限）
 * @param {Object} context 云函数上下文
 * @param {string} userId 用户ID
 * @param {string} taskId 任务ID
 * @param {string} permission 权限类型
 * @returns {Object} 权限检查结果 { success: boolean, task?: Object, error?: Object }
 */
async function checkTaskPermission(context, userId, taskId, permission) {
  const db = context.db
  
  try {
    // 获取任务信息
    const taskResult = await db.collection('todoitems')
      .where({ _id: taskId })
      .get()
    
    if (taskResult.data.length === 0) {
      return {
        success: false,
        error: createErrorResponse(ERROR_CODES.NOT_FOUND, '任务不存在')
      }
    }
    
    const task = taskResult.data[0]
    
    // 检查项目册权限
    const permissionResult = await checkTodoBookPermission(context, userId, task.todobook_id, permission)
    
    if (!permissionResult.success) {
      return permissionResult
    }
    
    return {
      success: true,
      task: task
    }
  } catch (error) {
    console.error('任务权限检查失败:', error)
    return {
      success: false,
      error: createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '权限检查失败')
    }
  }
}

/**
 * 检查是否是项目册创建者
 * @param {Object} context 云函数上下文
 * @param {string} userId 用户ID
 * @param {string} todoBookId 项目册ID
 * @returns {Object} 检查结果 { success: boolean, isCreator: boolean, error?: Object }
 */
async function checkIsCreator(context, userId, todoBookId) {
  const db = context.db
  
  try {
    console.log(`🔍 [创建者检查调试] 开始检查用户 ${userId} 是否为项目册 ${todoBookId} 的创建者`)
    
    const bookResult = await db.collection('todobooks')
      .where({ _id: todoBookId, creator_id: userId })
      .get()
    
    console.log(`🔍 [创建者检查调试] 查询结果数量: ${bookResult.data.length}`)
    if (bookResult.data.length > 0) {
      console.log(`🔍 [创建者检查调试] 项目册信息:`, JSON.stringify(bookResult.data[0], null, 2))
    }
    
    const isCreator = bookResult.data.length > 0
    console.log(`🔍 [创建者检查调试] 最终结果: ${isCreator}`)
    
    return {
      success: true,
      isCreator: isCreator
    }
  } catch (error) {
    console.error('创建者检查失败:', error)
    return {
      success: false,
      error: createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '权限检查失败')
    }
  }
}

module.exports = {
  checkTodoBookPermission,
  checkTaskPermission,
  checkIsCreator
}