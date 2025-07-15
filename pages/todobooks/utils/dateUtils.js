/**
 * 格式化加入时间
 * @param {string|Date} joinTime - 加入时间
 * @returns {string} 格式化后的加入时间
 */
export function formatJoinTime(joinTime) {
  if (!joinTime) return ''
  
  const date = new Date(joinTime)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天加入'
  } else if (days === 1) {
    return '昨天加入'
  } else if (days < 30) {
    return `${days}天前加入`
  } else {
    return date.toLocaleDateString() + '加入'
  }
}

/**
 * 格式化截止日期
 * @param {string|Date} dueDate - 截止日期
 * @returns {string} 格式化后的截止日期
 */
export function formatDueDate(dueDate) {
  if (!dueDate) return ''
  
  const date = new Date(dueDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === -1) return '昨天'
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}天后`
  if (diffDays < 0 && diffDays >= -7) return `逾期${Math.abs(diffDays)}天`
  
  // 超过7天的显示具体日期
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

/**
 * 检查日期是否过期
 * @param {string|Date} date - 日期
 * @returns {boolean} 是否过期
 */
export function isOverdue(date) {
  if (!date) return false
  
  const targetDate = new Date(date)
  const now = new Date()
  
  // 只比较日期，不考虑时间
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const taskDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  
  return taskDate < today
}