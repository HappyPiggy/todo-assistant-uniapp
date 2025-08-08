// 功能访问守卫工具
// 用于检查和控制访客用户的功能访问权限
import { useAuthState } from '@/composables/useAuthState.js'

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
  'multiple_todobooks',
  'cloud_sync',
  'export_data',
  'import_data'
]

// 功能对应的提示消息
const FEATURE_MESSAGES = {
  tag_management: '标签管理功能需要登录后使用，登录后可以创建和管理自定义标签',
  member_management: '成员管理功能需要登录后使用，登录后可以邀请团队成员协作',
  share_management: '分享管理功能需要登录后使用，登录后可以分享项目册给其他用户',
  archive_management: '归档管理功能需要登录后使用，登录后可以查看和管理已归档的项目册',
  statistics: '统计功能需要登录后使用，登录后可以查看详细的数据统计分析',
  task_comments: '评论功能需要登录后使用，登录后可以给任务添加评论和讨论',
  multiple_todobooks: '创建多个项目册需要登录后使用，未登录用户最多只能创建1个项目册',
  cloud_sync: '云端同步功能需要登录后使用，登录后数据将自动同步到云端',
  export_data: '数据导出功能需要登录后使用，登录后可以导出项目数据',
  import_data: '数据导入功能需要登录后使用，登录后可以导入外部数据'
}

// 需要登录的页面路径
const LOGIN_REQUIRED_PAGES = [
  '/pages/tags/manage',
  '/pages/archive-management/index',
  '/pages/settings/share-management',
  '/pages/todobooks/statistics',
  '/pages/todobooks/members'
]

// 受限制的组件或功能区域
const RESTRICTED_COMPONENTS = [
  'TodoBookStatistics',
  'MemberManagement',
  'ShareManagement',
  'TagManagement',
  'TaskComments',
  'ArchiveManagement'
]

/**
 * 检查功能访问权限
 * @param {string} feature - 功能名称
 * @param {boolean} isGuest - 是否为访客用户
 * @returns {Object} 权限检查结果
 */
export function checkFeatureAccess(feature, isGuest = null) {
  // 如果没有传入isGuest参数，则从useAuthState获取
  if (isGuest === null) {
    const { isGuest: guestState } = useAuthState()
    isGuest = guestState.value
  }
  
  if (!isGuest) {
    // 已登录用户，允许所有功能
    return {
      allowed: true,
      message: '',
      action: 'allow'
    }
  }
  
  // 访客用户权限检查
  if (GUEST_ALLOWED_FEATURES.includes(feature)) {
    return {
      allowed: true,
      message: '',
      action: 'allow'
    }
  }
  
  if (GUEST_BLOCKED_FEATURES.includes(feature)) {
    return {
      allowed: false,
      message: FEATURE_MESSAGES[feature] || '该功能需要登录才能使用',
      action: 'deny'
    }
  }
  
  // 未定义的功能，默认需要登录
  return {
    allowed: false,
    message: '该功能需要登录才能使用',
    action: 'deny'
  }
}

/**
 * 页面访问守卫
 * @param {string} pagePath - 页面路径
 * @returns {Object} 页面访问权限检查结果
 */
export function checkPageAccess(pagePath) {
  const { isGuest } = useAuthState()
  
  if (!isGuest.value) {
    return { allowed: true, message: '' }
  }
  
  // 检查是否为需要登录的页面
  const isRestrictedPage = LOGIN_REQUIRED_PAGES.some(restrictedPath => {
    return pagePath.includes(restrictedPath)
  })
  
  if (isRestrictedPage) {
    return {
      allowed: false,
      message: '该页面需要登录后访问',
      redirectToLogin: true
    }
  }
  
  return { allowed: true, message: '' }
}

/**
 * 组件级别的功能守卫
 * @param {string} componentName - 组件名称
 * @returns {Object} 组件访问权限检查结果
 */
export function checkComponentAccess(componentName) {
  const { isGuest } = useAuthState()
  
  if (!isGuest.value) {
    return { allowed: true, shouldRender: true }
  }
  
  if (RESTRICTED_COMPONENTS.includes(componentName)) {
    return {
      allowed: false,
      shouldRender: false,
      message: `${componentName} 组件需要登录后使用`
    }
  }
  
  return { allowed: true, shouldRender: true }
}

/**
 * 显示功能限制提示Modal
 * @param {string} feature - 功能名称
 * @param {string} customMessage - 自定义消息
 * @returns {Promise<boolean>} 用户是否选择登录
 */
export function showFeatureRestrictedModal(feature, customMessage = '') {
  const accessCheck = checkFeatureAccess(feature)
  
  if (accessCheck.allowed) {
    return Promise.resolve(true)
  }
  
  const message = customMessage || accessCheck.message
  
  return new Promise((resolve) => {
    uni.showModal({
      title: '功能受限',
      content: message,
      confirmText: '立即登录',
      cancelText: '稍后再说',
      confirmColor: '#007AFF',
      success: (res) => {
        if (res.confirm) {
          // 用户选择登录
          navigateToLogin()
          resolve(true)
        } else {
          // 用户选择稍后再说
          resolve(false)
        }
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 显示页面访问限制提示
 * @param {string} pagePath - 页面路径
 * @param {string} customMessage - 自定义消息
 * @returns {Promise<boolean>} 用户是否选择登录
 */
export function showPageRestrictedModal(pagePath, customMessage = '') {
  const message = customMessage || '该页面需要登录后访问，登录后可使用完整功能'
  
  return new Promise((resolve) => {
    uni.showModal({
      title: '页面受限',
      content: message,
      confirmText: '立即登录',
      cancelText: '返回',
      confirmColor: '#007AFF',
      success: (res) => {
        if (res.confirm) {
          navigateToLogin()
          resolve(true)
        } else {
          // 返回上一页
          uni.navigateBack()
          resolve(false)
        }
      },
      fail: () => {
        uni.navigateBack()
        resolve(false)
      }
    })
  })
}

/**
 * 跳转到登录页面
 */
export function navigateToLogin() {
  try {
    uni.navigateTo({
      url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd',
      fail: () => {
        // 如果navigateTo失败，尝试redirectTo
        uni.redirectTo({
          url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd',
          fail: () => {
            // 如果还是失败，显示提示
            uni.showToast({
              title: '跳转失败，请手动进入登录页',
              icon: 'none',
              duration: 2000
            })
          }
        })
      }
    })
  } catch (error) {
    console.error('跳转登录页面失败:', error)
    uni.showToast({
      title: '跳转失败，请手动进入登录页',
      icon: 'none',
      duration: 2000
    })
  }
}

/**
 * 快速检查并提示功能限制
 * @param {string} feature - 功能名称
 * @param {string} customMessage - 自定义消息
 * @returns {Promise<boolean>} 是否允许继续执行
 */
export async function guardFeature(feature, customMessage = '') {
  const accessCheck = checkFeatureAccess(feature)
  
  if (accessCheck.allowed) {
    return true
  }
  
  // 显示限制提示
  await showFeatureRestrictedModal(feature, customMessage)
  return false
}

/**
 * 快速检查页面访问权限
 * @param {string} pagePath - 页面路径
 * @param {string} customMessage - 自定义消息
 * @returns {Promise<boolean>} 是否允许访问页面
 */
export async function guardPage(pagePath, customMessage = '') {
  const accessCheck = checkPageAccess(pagePath)
  
  if (accessCheck.allowed) {
    return true
  }
  
  // 显示页面限制提示
  await showPageRestrictedModal(pagePath, customMessage)
  return false
}

/**
 * 创建功能守卫指令（用于Vue模板）
 * @returns {Object} Vue指令对象
 */
export function createFeatureGuardDirective() {
  return {
    mounted(el, binding) {
      const feature = binding.value
      const accessCheck = checkFeatureAccess(feature)
      
      if (!accessCheck.allowed) {
        // 隐藏元素并添加点击事件
        el.style.opacity = '0.5'
        el.style.pointerEvents = 'none'
        
        // 添加提示标识
        el.setAttribute('data-restricted', 'true')
        el.setAttribute('title', accessCheck.message)
      }
    },
    
    updated(el, binding) {
      const feature = binding.value
      const accessCheck = checkFeatureAccess(feature)
      
      if (!accessCheck.allowed) {
        el.style.opacity = '0.5'
        el.style.pointerEvents = 'none'
        el.setAttribute('data-restricted', 'true')
        el.setAttribute('title', accessCheck.message)
      } else {
        el.style.opacity = '1'
        el.style.pointerEvents = 'auto'
        el.removeAttribute('data-restricted')
        el.removeAttribute('title')
      }
    }
  }
}

// 导出常量
export {
  GUEST_ALLOWED_FEATURES,
  GUEST_BLOCKED_FEATURES,
  FEATURE_MESSAGES,
  LOGIN_REQUIRED_PAGES,
  RESTRICTED_COMPONENTS
}