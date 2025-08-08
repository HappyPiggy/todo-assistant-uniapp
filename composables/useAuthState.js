// 认证状态管理
// 用于判断用户登录状态并检查功能访问权限
import { computed, ref, watch } from 'vue'
import { store } from '@/uni_modules/uni-id-pages/common/store.js'
import { useLocalStorageManager } from '@/store/localStorageManager.js'

// 访客允许的功能列表
const GUEST_ALLOWED_FEATURES = [
  'view_todobook',
  'create_todobook', // 限制1个
  'edit_todobook',
  'delete_todobook',
  'manage_tasks',
  'view_task_detail',
  'create_task',
  'edit_task',
  'delete_task',
  'view_profile'
]

// 访客被禁止的功能列表
const GUEST_BLOCKED_FEATURES = [
  'tag_management',
  'member_management',
  'share_management', 
  'archive_management',
  'statistics',
  'task_comments',
  'multiple_todobooks', // 多个TodoBook管理
  'cloud_sync',
  'export_data',
  'import_data'
]

// 功能对应的提示消息
const FEATURE_MESSAGES = {
  tag_management: '标签管理功能需要登录后使用',
  member_management: '成员管理功能需要登录后使用',
  share_management: '分享管理功能需要登录后使用',
  archive_management: '归档管理功能需要登录后使用',
  statistics: '统计功能需要登录后使用',
  task_comments: '评论功能需要登录后使用',
  multiple_todobooks: '创建多个项目册需要登录后使用',
  cloud_sync: '云端同步功能需要登录后使用',
  export_data: '数据导出功能需要登录后使用',
  import_data: '数据导入功能需要登录后使用'
}

// 全局的登录状态刷新触发器
const loginStateRefresh = ref(0)

// 刷新登录状态的方法
const refreshLoginState = () => {
  loginStateRefresh.value++
  console.log('refreshLoginState: 手动触发登录状态刷新', loginStateRefresh.value)
}

export function useAuthState() {
  // 监听登录状态变化事件，自动触发刷新
  uni.$on('login-status-changed', () => {
    refreshLoginState()
  })
  
  // 检查用户登录状态
  // 使用store.hasLogin确保与其他组件保持一致
  const isGuest = computed(() => {
    // 通过访问 loginStateRefresh 来建立依赖关系
    loginStateRefresh.value
    
    try {
      // 使用store.hasLogin确保状态一致性
      const hasLogin = store.hasLogin
      console.log('useAuthState: isGuest计算中, store.hasLogin:', hasLogin)
      return !hasLogin
    } catch (error) {
      console.error('获取用户登录状态失败:', error)
      return true // 默认为访客状态
    }
  })
  
  // 用户模式
  const userMode = computed(() => isGuest.value ? 'guest' : 'user')
  
  // 获取用户信息
  const userInfo = computed(() => {
    if (isGuest.value) {
      return {
        nickname: '访客用户',
        avatar: '',
        _id: null
      }
    }
    
    try {
      return store.userInfo || {}
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return {}
    }
  })
  
  // 检查功能访问权限
  const checkFeatureAccess = (feature) => {
    if (!isGuest.value) {
      // 已登录用户，允许所有功能
      return { 
        allowed: true, 
        message: '' 
      }
    }
    
    // 访客用户，检查功能权限
    if (GUEST_ALLOWED_FEATURES.includes(feature)) {
      return { 
        allowed: true, 
        message: '' 
      }
    }
    
    if (GUEST_BLOCKED_FEATURES.includes(feature)) {
      return { 
        allowed: false, 
        message: FEATURE_MESSAGES[feature] || '该功能需要登录才能使用'
      }
    }
    
    // 未定义的功能，默认需要登录
    return { 
      allowed: false, 
      message: '该功能需要登录才能使用'
    }
  }
  
  // 显示功能限制提示
  const showFeatureRestrictedModal = (feature, customMessage = '') => {
    const accessCheck = checkFeatureAccess(feature)
    
    if (accessCheck.allowed) {
      return Promise.resolve(true)
    }
    
    return new Promise((resolve) => {
      uni.showModal({
        title: '功能受限',
        content: customMessage || accessCheck.message,
        confirmText: '立即登录',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            // 跳转到登录页面
            navigateToLogin()
            resolve(false)
          } else {
            resolve(false)
          }
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  }
  
  // 跳转到登录页面
  const navigateToLogin = () => {
    try {
      uni.navigateTo({
        url: '/pages/login/login-withpwd',
        fail: () => {
          // 如果navigateTo失败，尝试redirectTo
          uni.redirectTo({
            url: '/pages/login/login-withpwdd'
          })
        }
      })
    } catch (error) {
      console.error('跳转登录页面失败:', error)
      uni.showToast({
        title: '跳转失败，请手动进入登录页',
        icon: 'none'
      })
    }
  }
  
  // 检查TodoBook创建权限（访客最多1个）
  const checkTodoBookCreatePermission = async () => {
    if (!isGuest.value) {
      return { allowed: true, message: '' }
    }
    
    try {
      const localManager = useLocalStorageManager()
      const books = await localManager.getTodoBooks()
      
      if (books.length >= 1) {
        return {
          allowed: false,
          message: '未登录用户最多只能创建1个项目册，登录后可创建更多'
        }
      }
      
      return { allowed: true, message: '' }
    } catch (error) {
      console.error('检查TodoBook创建权限失败:', error)
      return { allowed: false, message: '检查权限时出错' }
    }
  }
  
  // 监听用户登录状态变化
  const onUserLogin = () => {
    // 用户登录后的处理逻辑
    console.log('用户已登录，切换到登录模式')
    
    // 触发全局事件，通知其他页面更新状态
    uni.$emit('user-login-status-changed', {
      isGuest: false,
      userMode: 'user'
    })
  }
  
  const onUserLogout = () => {
    // 用户退出登录后的处理逻辑
    console.log('用户已退出，切换到访客模式')
    
    // 触发全局事件，通知其他页面更新状态
    uni.$emit('user-login-status-changed', {
      isGuest: true,
      userMode: 'guest'
    })
  }
  
  // 获取页面标题前缀（用于显示访客模式标识）
  const getPageTitlePrefix = () => {
    return isGuest.value ? '[访客模式] ' : ''
  }
  
  return {
    // 状态
    isGuest,
    userMode,
    userInfo,
    
    // 方法
    checkFeatureAccess,
    showFeatureRestrictedModal,
    navigateToLogin,
    checkTodoBookCreatePermission,
    onUserLogin,
    onUserLogout,
    getPageTitlePrefix,
    refreshLoginState,  // 导出手动刷新方法
    
    // 常量
    GUEST_ALLOWED_FEATURES,
    GUEST_BLOCKED_FEATURES
  }
}