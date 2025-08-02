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

/**
 * 格式化时间为年月日分格式
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的时间 (yyyy年mm月dd日 hh:mm)
 */
export function formatDateTime(date) {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  
  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}