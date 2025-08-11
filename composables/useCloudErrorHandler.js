// 云函数错误处理组合式函数
import { useTokenCheck } from '@/composables/useTokenCheck.js'

/**
 * 云函数错误处理hooks
 */
export function useCloudErrorHandler() {
  const { handleTokenExpired } = useTokenCheck()
  
  // 常见的token过期错误码
  const TOKEN_EXPIRED_CODES = [
    'TOKEN_INVALID',
    'TOKEN_EXPIRED', 
    'PERMISSION_DENIED',
    'UNAUTHORIZED',
    70009, // uni-id-common token过期错误码
    30201, // uni-id token过期
    30202  // uni-id token无效
  ]
  
  // 常见的token过期错误信息关键词
  const TOKEN_EXPIRED_KEYWORDS = [
    'token已过期',
    'token过期',
    'token无效',
    'token invalid',
    'token expired',
    'unauthorized',
    '登录已过期',
    '身份验证失败',
    'authentication failed'
  ]
  
  /**
   * 判断是否为token过期错误
   * @param {Object} error - 错误对象
   * @returns {boolean} 是否为token过期错误
   */
  const isTokenExpiredError = (error) => {
    if (!error) return false
    
    // 检查错误码
    if (error.code || error.errCode) {
      const errorCode = error.code || error.errCode
      if (TOKEN_EXPIRED_CODES.includes(errorCode)) {
        return true
      }
    }
    
    // 检查错误信息
    const message = error.message || error.errMsg || ''
    if (TOKEN_EXPIRED_KEYWORDS.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    )) {
      return true
    }
    
    return false
  }
  
  /**
   * 处理云函数调用错误
   * @param {Object} error - 错误对象
   * @param {string} operation - 操作名称（用于日志）
   * @returns {Promise<boolean>} 是否已处理token过期错误
   */
  const handleCloudError = async (error, operation = '操作') => {
    try {
      console.error(`${operation}失败:`, error)
      
      // 检查是否为token过期错误
      if (isTokenExpiredError(error)) {
        console.log('检测到token过期错误，执行清理操作')
        await handleTokenExpired(`${operation}失败，登录已过期，请重新登录`)
        return true // 已处理token过期
      }
      
      return false // 不是token过期错误
      
    } catch (err) {
      console.error('处理云函数错误失败:', err)
      return false
    }
  }
  
  /**
   * 包装云函数调用，自动处理token过期
   * @param {Function} cloudFunction - 云函数调用
   * @param {string} operation - 操作名称
   * @returns {Promise} 云函数调用结果
   */
  const wrapCloudCall = async (cloudFunction, operation = '操作') => {
    try {
      return await cloudFunction()
    } catch (error) {
      // 处理错误
      const isTokenError = await handleCloudError(error, operation)
      
      if (isTokenError) {
        // 如果是token过期错误，抛出特定错误
        const tokenError = new Error('TOKEN_EXPIRED')
        tokenError.code = 'TOKEN_EXPIRED'
        tokenError.isTokenExpired = true
        throw tokenError
      }
      
      // 重新抛出原错误
      throw error
    }
  }
  
  /**
   * 安全的云函数调用（忽略token过期错误）
   * @param {Function} cloudFunction - 云函数调用
   * @param {string} operation - 操作名称
   * @param {any} defaultValue - token过期时返回的默认值
   * @returns {Promise} 云函数调用结果或默认值
   */
  const safeCloudCall = async (cloudFunction, operation = '操作', defaultValue = null) => {
    try {
      return await wrapCloudCall(cloudFunction, operation)
    } catch (error) {
      if (error.isTokenExpired) {
        console.log(`${operation}: token已过期，返回默认值`)
        return defaultValue
      }
      // 重新抛出非token过期的错误
      throw error
    }
  }
  
  return {
    isTokenExpiredError,
    handleCloudError,
    wrapCloudCall,
    safeCloudCall
  }
}