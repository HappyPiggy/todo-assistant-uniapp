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

      // 获取当前用户token信息（可能不包含 token 字段）
      const currentUserInfo = uniCloud.getCurrentUserInfo() || {}

      // 从本地存储回退读取 token 信息（uniCloud 客户端默认使用 uni_id_token）
      const storedToken = uni.getStorageSync('uni_id_token')
      const storedExpired = uni.getStorageSync('uni_id_token_expired') || 0

      // 兼容：某些平台 getCurrentUserInfo 不返回 token，仅返回 uid 和 tokenExpired
      const uid = currentUserInfo.uid || null
      let tokenExpired = currentUserInfo.tokenExpired || 0

      // 若未取到 tokenExpired，使用本地持久化的过期时间
      if (!tokenExpired && storedExpired) {
        tokenExpired = storedExpired
      }

      // 如果既没有 uid 也没有本地持久化的 token，则视为未登录/过期
      if (!uid && !storedToken) {
        console.log('未找到任何登录凭据（uid/token），视为已过期')
        return {
          isExpired: true,
          tokenInfo: null
        }
      }

      // 检查token是否过期
      const currentTime = Date.now()

      const isExpired = !tokenExpired || tokenExpired <= currentTime

      console.log('Token过期检查:', {
        hasUid: !!uid,
        hasStoredToken: !!storedToken,
        currentTime,
        tokenExpired,
        isExpired
      })

      return {
        isExpired,
        tokenInfo: {
          ...currentUserInfo,
          tokenExpired
        }
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
