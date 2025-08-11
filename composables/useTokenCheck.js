// token过期检测组合式函数
import { ref } from 'vue'
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'

/**
 * token过期检测hooks
 */
export function useTokenCheck() {
  const isChecking = ref(false)
  
  /**
   * 检查token是否过期
   * @returns {Promise<{isExpired: boolean, tokenInfo: object|null}>}
   */
  const checkTokenExpired = async () => {
    try {
      isChecking.value = true
      
      // 获取当前用户token信息
      const currentUserInfo = uniCloud.getCurrentUserInfo()
      
      // 如果没有token信息，视为过期
      if (!currentUserInfo.uid || !currentUserInfo.token) {
        console.log('未找到token信息，视为已过期')
        return {
          isExpired: true,
          tokenInfo: null
        }
      }
      
      // 检查token是否过期
      const currentTime = Date.now()
      const tokenExpired = currentUserInfo.tokenExpired || 0
      
      console.log('Token过期检查:', {
        currentTime,
        tokenExpired,
        isExpired: tokenExpired <= currentTime
      })
      
      const isExpired = tokenExpired <= currentTime
      
      return {
        isExpired,
        tokenInfo: currentUserInfo
      }
      
    } catch (error) {
      console.error('检查token过期状态失败:', error)
      // 发生错误时视为过期，安全起见
      return {
        isExpired: true,
        tokenInfo: null
      }
    } finally {
      isChecking.value = false
    }
  }
  
  /**
   * 处理token过期 - 清理用户状态并提示
   * @param {string} message 提示消息
   */
  const handleTokenExpired = async (message = 'token已过期，已切换到访客模式') => {
    try {
      console.log('处理token过期:', message)
      
      // 显示过期提示
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 3000
      })
      
      // 清理本地token和用户信息
      uni.removeStorageSync('uni_id_token')
      uni.setStorageSync('uni_id_token_expired', 0)
      
      // 更新store状态为未登录
      mutations.setUserInfo({}, { cover: true })
      
      // 发送全局事件通知其他组件
      uni.$emit('token-expired', {
        message,
        timestamp: Date.now()
      })
      
      console.log('token过期处理完成')
      
    } catch (error) {
      console.error('处理token过期失败:', error)
    }
  }
  
  /**
   * 启动时检查token状态
   * @returns {Promise<boolean>} 是否需要重新登录
   */
  const checkTokenOnStartup = async () => {
    try {
      console.log('启动时检查token状态...')
      
      const { isExpired, tokenInfo } = await checkTokenExpired()
      
      if (isExpired) {
        console.log('启动时发现token已过期')
        await handleTokenExpired('登录已过期，已切换到访客模式')
        return true // 需要重新登录
      }
      
      console.log('token状态正常')
      return false // 不需要重新登录
      
    } catch (error) {
      console.error('启动时token检查失败:', error)
      // 发生错误时要求重新登录，安全起见
      await handleTokenExpired('登录状态验证失败，请重新登录')
      return true
    }
  }
  
  /**
   * 静默检查token（不显示提示）
   * @returns {Promise<boolean>} token是否有效
   */
  const silentCheckToken = async () => {
    try {
      const { isExpired } = await checkTokenExpired()
      return !isExpired
    } catch (error) {
      console.error('静默token检查失败:', error)
      return false
    }
  }
  
  return {
    isChecking,
    checkTokenExpired,
    handleTokenExpired,
    checkTokenOnStartup,
    silentCheckToken
  }
}