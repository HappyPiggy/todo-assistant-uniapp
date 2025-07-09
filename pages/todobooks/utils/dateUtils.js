/**
 * 格式化日期为相对时间
 * @param {string|Date} date - 日期
 * @returns {string} 相对时间文本
 */
export function formatRelativeTime(date) {
  if (!date) return ''
  
  const targetDate = new Date(date)
  const now = new Date()
  const diff = now - targetDate
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  
  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days === 1) return '昨天'
  if (days < 30) return `${days}天前`
  if (months === 1) return '上个月'
  if (months < 12) return `${months}个月前`
  if (years === 1) return '去年'
  return `${years}年前`
}

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
 * 检查日期是否为今天
 * @param {string|Date} date - 日期
 * @returns {boolean} 是否为今天
 */
export function isToday(date) {
  if (!date) return false
  
  const targetDate = new Date(date)
  const today = new Date()
  
  return targetDate.getFullYear() === today.getFullYear() &&
         targetDate.getMonth() === today.getMonth() &&
         targetDate.getDate() === today.getDate()
}

/**
 * 检查日期是否为昨天
 * @param {string|Date} date - 日期
 * @returns {boolean} 是否为昨天
 */
export function isYesterday(date) {
  if (!date) return false
  
  const targetDate = new Date(date)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  return targetDate.getFullYear() === yesterday.getFullYear() &&
         targetDate.getMonth() === yesterday.getMonth() &&
         targetDate.getDate() === yesterday.getDate()
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
 * 获取日期范围内的天数
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {number} 天数
 */
export function getDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 格式化日期为标准格式
 * @param {string|Date} date - 日期
 * @param {string} format - 格式化选项
 * @returns {string} 格式化后的日期
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  
  const targetDate = new Date(date)
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  const hours = String(targetDate.getHours()).padStart(2, '0')
  const minutes = String(targetDate.getMinutes()).padStart(2, '0')
  const seconds = String(targetDate.getSeconds()).padStart(2, '0')
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`
    case 'MM-DD':
      return `${month}-${day}`
    case 'MM/DD':
      return `${month}/${day}`
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    case 'HH:mm':
      return `${hours}:${minutes}`
    case 'HH:mm:ss':
      return `${hours}:${minutes}:${seconds}`
    default:
      return targetDate.toLocaleDateString()
  }
}

/**
 * 获取日期的开始时间（00:00:00）
 * @param {string|Date} date - 日期
 * @returns {Date} 日期开始时间
 */
export function getStartOfDay(date) {
  const targetDate = new Date(date)
  return new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
}

/**
 * 获取日期的结束时间（23:59:59）
 * @param {string|Date} date - 日期
 * @returns {Date} 日期结束时间
 */
export function getEndOfDay(date) {
  const targetDate = new Date(date)
  return new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999)
}

/**
 * 获取本周开始日期（周一）
 * @param {string|Date} date - 参考日期
 * @returns {Date} 本周开始日期
 */
export function getStartOfWeek(date = new Date()) {
  const targetDate = new Date(date)
  const day = targetDate.getDay()
  const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1) // 周一为一周开始
  return new Date(targetDate.setDate(diff))
}

/**
 * 获取本月开始日期
 * @param {string|Date} date - 参考日期
 * @returns {Date} 本月开始日期
 */
export function getStartOfMonth(date = new Date()) {
  const targetDate = new Date(date)
  return new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
}

/**
 * 获取本月结束日期
 * @param {string|Date} date - 参考日期
 * @returns {Date} 本月结束日期
 */
export function getEndOfMonth(date = new Date()) {
  const targetDate = new Date(date)
  return new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
}

/**
 * 检查日期是否在指定范围内
 * @param {string|Date} date - 要检查的日期
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {boolean} 是否在范围内
 */
export function isDateInRange(date, startDate, endDate) {
  if (!date || !startDate || !endDate) return false
  
  const targetDate = new Date(date)
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return targetDate >= start && targetDate <= end
}

/**
 * 添加指定天数到日期
 * @param {string|Date} date - 基础日期
 * @param {number} days - 要添加的天数
 * @returns {Date} 新日期
 */
export function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * 减去指定天数从日期
 * @param {string|Date} date - 基础日期
 * @param {number} days - 要减去的天数
 * @returns {Date} 新日期
 */
export function subtractDays(date, days) {
  return addDays(date, -days)
}

/**
 * 获取两个日期之间的工作日数量
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {number} 工作日数量
 */
export function getWeekdaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  let count = 0
  const current = new Date(start)
  
  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) { // 排除周末
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}