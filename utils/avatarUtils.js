/**
 * 头像工具函数
 * 统一处理项目中所有头像获取逻辑
 */

/**
 * 获取用户头像URL或占位符文本
 * @param {Object} user - 用户对象
 * @param {Object} options - 选项
 * @param {boolean} options.returnPlaceholder - 是否返回占位符文本而非URL
 * @returns {string} 头像URL或占位符文本
 */
export function getUserAvatar(user, options = {}) {
  if (!user) return options.returnPlaceholder ? '?' : ''
  
  // 尝试获取头像URL
  const avatarUrl = getAvatarUrl(user)
  
  if (avatarUrl && !options.returnPlaceholder) {
    return avatarUrl
  }
  
  // 返回占位符文本
  if (options.returnPlaceholder || !avatarUrl) {
    return getAvatarPlaceholder(user)
  }
  
  return avatarUrl || ''
}

/**
 * 获取头像URL
 * @param {Object} user - 用户对象
 * @returns {string} 头像URL
 */
function getAvatarUrl(user) {
  if (!user) return ''
  
  // 用户中心场景：直接从userInfo获取
  if (user.avatar) {
    return user.avatar
  }
  
  // 成员管理场景：从嵌套的user_info获取
  if (user['user_info.avatar']) {
    return user['user_info.avatar']
  }
  
  if (user['user_info.avatar_url']) {
    return user['user_info.avatar_url']
  }
  
  if (user['user_info.avatar_file']) {
    return user['user_info.avatar_file']
  }
  
  // 直接从user_info对象获取（当数据结构为对象而非字符串键时）
  if (user.user_info && typeof user.user_info === 'object') {
    if (user.user_info.avatar) {
      return user.user_info.avatar
    }
    if (user.user_info.avatar_file) {
      return user.user_info.avatar_file
    }
  }
  
  // 评论场景：user_avatar字段
  if (user.user_avatar) {
    return user.user_avatar
  }
  
  // 直接的avatar_file字段
  if (user.avatar_file) {
    return user.avatar_file
  }
  
  return ''
}

/**
 * 获取头像占位符文本（用户昵称首字母）
 * @param {Object} user - 用户对象
 * @returns {string} 占位符文本
 */
function getAvatarPlaceholder(user) {
  if (!user) return '?'
  
  // 尝试从不同字段获取昵称
  let nickname = ''
  
  // 用户中心场景
  if (user.nickname) {
    nickname = user.nickname
  }
  // 成员管理场景
  else if (user['user_info.nickname']) {
    nickname = user['user_info.nickname']
  }
  // 直接从user_info对象获取
  else if (user.user_info && typeof user.user_info === 'object' && user.user_info.nickname) {
    nickname = user.user_info.nickname
  }
  // 评论场景
  else if (user.user_nickname) {
    nickname = user.user_nickname
  }
  // 其他字段
  else if (user.username) {
    nickname = user.username
  }
  
  return nickname ? nickname.charAt(0).toUpperCase() : '?'
}

/**
 * 获取成员头像（兼容现有的useMemberData逻辑）
 * @param {Object} member - 成员对象
 * @returns {string} 头像URL
 */
export function getMemberAvatar(member) {
  return getUserAvatar(member)
}

/**
 * 获取成员头像占位符文本
 * @param {Object} member - 成员对象
 * @returns {string} 占位符文本
 */
export function getMemberAvatarPlaceholder(member) {
  return getUserAvatar(member, { returnPlaceholder: true })
}

/**
 * 获取评论用户头像
 * @param {Object} comment - 评论对象
 * @returns {string} 头像URL
 */
export function getCommentAvatar(comment) {
  return getUserAvatar(comment)
}

/**
 * 获取评论用户头像占位符文本
 * @param {Object} comment - 评论对象
 * @returns {string} 占位符文本
 */
export function getCommentAvatarPlaceholder(comment) {
  return getUserAvatar(comment, { returnPlaceholder: true })
}

/**
 * 检查是否有头像
 * @param {Object} user - 用户对象
 * @returns {boolean} 是否有头像
 */
export function hasAvatar(user) {
  return !!getAvatarUrl(user)
}

/**
 * 获取默认头像路径（基于用户ID或昵称）
 * @param {Object} user - 用户对象
 * @returns {string} 默认头像路径
 */
export function getDefaultAvatarPath(user) {
  if (!user) return '/static/avatar/avatar1.svg'
  
  // 根据用户ID或昵称生成一个固定的头像索引
  const identifier = user._id || user.user_id || user.nickname || user.username || 'default'
  const hash = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const avatarIndex = (hash % 8) + 1
  
  return `/static/avatar/avatar${avatarIndex}.svg`
}