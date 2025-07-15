import { BOOK_CONSTANTS } from './constants.js'

/**
 * 计算项目册完成率
 * @param {Object} bookData - 项目册数据
 * @returns {number} 完成率百分比
 */
export function calculateCompletionRate(bookData) {
  if (!bookData || bookData.item_count === 0) return 0
  return Math.round((bookData.completed_count / bookData.item_count) * 100)
}

/**
 * 获取颜色选项
 * @returns {Array} 颜色选项数组
 */
export function getColorOptions() {
  return BOOK_CONSTANTS.COLOR_OPTIONS
}

/**
 * 获取图标选项
 * @returns {Array} 图标选项数组
 */
export function getIconOptions() {
  return BOOK_CONSTANTS.ICON_OPTIONS
}



/**
 * 格式化相对时间
 * @param {string|Date} timeStr - 时间字符串或Date对象
 * @returns {string} 格式化后的相对时间
 */
export function formatRelativeTime(timeStr) {
  if (!timeStr) return ''
  
  const time = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return minutes <= 1 ? '刚刚' : `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return time.toLocaleDateString()
  }
}

/**
 * 计算项目册进度百分比
 * @param {Object} book - 项目册对象
 * @returns {number} 进度百分比(0-100)
 */
export function calculateProgress(book) {
  if (!book.item_count || book.item_count === 0) return 0
  return Math.round((book.completed_count / book.item_count) * 100)
}