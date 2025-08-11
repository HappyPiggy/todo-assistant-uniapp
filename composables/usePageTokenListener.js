// 页面级token过期监听组合式函数
import { onMounted, onUnmounted } from 'vue'

/**
 * 页面级token过期监听hooks
 * @param {Object} options - 配置选项
 * @param {Function} options.onTokenExpired - token过期回调
 * @param {boolean} options.redirectToLogin - 是否自动跳转到登录页（默认false，退出到访客模式）
 * @param {string} options.pageName - 页面名称（用于日志）
 */
export function usePageTokenListener(options = {}) {
  const {
    onTokenExpired,
    redirectToLogin = false, // 改为默认不跳转登录页，而是保持访客模式
    pageName = '当前页面'
  } = options
  
  // token过期处理
  const handleTokenExpired = (event) => {
    console.log(`${pageName}: 接收到token过期事件`, event)
    
    // 执行自定义回调
    if (typeof onTokenExpired === 'function') {
      try {
        onTokenExpired(event)
      } catch (error) {
        console.error(`${pageName}: token过期回调执行失败`, error)
      }
    }
    
    // 根据配置决定跳转行为
    if (redirectToLogin) {
      setTimeout(() => {
        console.log(`${pageName}: 自动跳转到登录页`)
        uni.reLaunch({
          url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
        })
      }, 1500) // 延迟1.5秒跳转，让用户看到提示
    } else {
      // 默认跳转到list页面，以访客模式继续使用
      setTimeout(() => {
        // 检查当前是否已经在list页面
        const currentPages = getCurrentPages()
        const currentPage = currentPages[currentPages.length - 1]
        const currentRoute = currentPage ? currentPage.route : ''
        
        if (currentRoute === 'pages/list/list') {
          console.log(`${pageName}: 当前已在list页面，不需要跳转，直接刷新数据`)
          // 如果已经在list页面，发送刷新事件而不是跳转
          uni.$emit('refresh-guest-data')
        } else {
          console.log(`${pageName}: token过期，跳转到访客模式首页`)
          uni.reLaunch({
            url: '/pages/list/list'
          })
        }
      }, 1500) // 延迟1.5秒跳转，让用户看到提示
    }
  }
  
  // 登录状态变化处理
  const handleLoginStatusChanged = (event) => {
    console.log(`${pageName}: 登录状态变化`, event)
    
    // 如果变为未登录状态，清理页面数据
    if (!event.hasLogin) {
      console.log(`${pageName}: 用户已退出登录，准备清理页面数据`)
      
      // 执行自定义回调
      if (typeof onTokenExpired === 'function') {
        try {
          onTokenExpired({ type: 'logout', ...event })
        } catch (error) {
          console.error(`${pageName}: 登录状态变化回调执行失败`, error)
        }
      }
    }
  }
  
  // 页面挂载时注册事件监听
  onMounted(() => {
    console.log(`${pageName}: 注册token过期监听器`)
    uni.$on('token-expired', handleTokenExpired)
    uni.$on('login-status-changed', handleLoginStatusChanged)
  })
  
  // 页面卸载时移除事件监听
  onUnmounted(() => {
    console.log(`${pageName}: 移除token过期监听器`)
    uni.$off('token-expired', handleTokenExpired)
    uni.$off('login-status-changed', handleLoginStatusChanged)
  })
  
  return {
    // 可以在组件中手动调用的方法
    handleTokenExpired,
    handleLoginStatusChanged
  }
}