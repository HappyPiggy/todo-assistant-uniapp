// 认证相关工具函数

const { ERROR_CODES } = require('../../common/constants')
const { createErrorResponse } = require('../../common/utils')

/**
 * 验证用户认证状态
 * @param {Object} context 云函数上下文
 * @returns {Object} 认证结果 { success: boolean, uid?: string, error?: Object }
 */
async function validateAuth(context) {
  const token = context.getUniIdToken()
  if (!token) {
    return {
      success: false,
      error: createErrorResponse(ERROR_CODES.UNAUTHORIZED, '用户未登录或token已过期')
    }
  }
  
  try {
    const payload = await context.uniID.checkToken(token)
    
    if (payload.code !== 0) {
      console.error('Token验证失败:', payload)
      return {
        success: false,
        error: createErrorResponse(
          payload.code || ERROR_CODES.UNAUTHORIZED,
          payload.message || payload.errMsg || '用户未登录或token已过期'
        )
      }
    }
    
    return {
      success: true,
      uid: payload.uid,
      userInfo: payload
    }
  } catch (error) {
    console.error('认证验证异常:', error)
    return {
      success: false,
      error: createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '认证验证失败')
    }
  }
}

/**
 * 获取数据库实例
 * @param {Object} context 云函数上下文
 * @returns {Object} 数据库实例
 */
function getDatabase(context) {
  return context.db || uniCloud.database()
}

module.exports = {
  validateAuth,
  getDatabase
}