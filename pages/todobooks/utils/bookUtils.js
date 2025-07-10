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
 * 获取颜色名称
 * @param {string} colorValue - 颜色值
 * @returns {string} 颜色名称
 */
export function getColorName(colorValue) {
  const option = BOOK_CONSTANTS.COLOR_OPTIONS.find(option => option.value === colorValue)
  return option ? option.name : '未知颜色'
}

/**
 * 获取图标名称
 * @param {string} iconValue - 图标值
 * @returns {string} 图标名称
 */
export function getIconName(iconValue) {
  const option = BOOK_CONSTANTS.ICON_OPTIONS.find(option => option.value === iconValue)
  return option ? option.name : '未知图标'
}


/**
 * 格式化项目册数据用于提交
 * @param {Object} formData - 表单数据
 * @returns {Object} 格式化后的数据
 */
export function formatBookDataForSubmit(formData) {
  return {
    title: formData.title.trim(),
    description: formData.description.trim(),
    color: formData.color || BOOK_CONSTANTS.DEFAULT_COLOR,
    icon: formData.icon || BOOK_CONSTANTS.DEFAULT_ICON
  }
}

/**
 * 检查项目册表单是否有变更
 * @param {Object} formData - 当前表单数据
 * @param {Object} originalData - 原始数据
 * @returns {boolean} 是否有变更
 */
export function hasBookFormChanges(formData, originalData) {
  if (!originalData) return true
  
  return formData.title !== originalData.title ||
         formData.description !== (originalData.description || '') ||
         formData.color !== (originalData.color || BOOK_CONSTANTS.DEFAULT_COLOR) ||
         formData.icon !== (originalData.icon || BOOK_CONSTANTS.DEFAULT_ICON)
}

/**
 * 生成项目册统计摘要文本
 * @param {Object} bookData - 项目册数据
 * @returns {string} 摘要文本
 */
export function generateBookSummary(bookData) {
  if (!bookData) return '项目册信息不可用'
  
  const total = bookData.item_count || 0
  const completed = bookData.completed_count || 0
  const members = bookData.member_count || 1
  const rate = calculateCompletionRate(bookData)
  
  return `共 ${total} 个任务，已完成 ${completed} 个（${rate}%），${members} 个成员`
}

/**
 * 获取项目册状态描述
 * @param {Object} bookData - 项目册数据
 * @returns {Object} 状态描述
 */
export function getBookStatus(bookData) {
  if (!bookData) {
    return { status: 'unknown', text: '未知状态', color: '#999999' }
  }
  
  const rate = calculateCompletionRate(bookData)
  
  if (rate === 100) {
    return { status: 'completed', text: '已完成', color: '#28a745' }
  } else if (rate > 0) {
    return { status: 'progress', text: '进行中', color: '#ff9800' }
  } else {
    return { status: 'todo', text: '未开始', color: '#007AFF' }
  }
}

/**
 * 格式化项目册创建时间
 * @param {string|Date} createTime - 创建时间
 * @returns {string} 格式化后的时间
 */
export function formatBookCreateTime(createTime) {
  if (!createTime) return ''
  
  const date = new Date(createTime)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天创建'
  } else if (days === 1) {
    return '昨天创建'
  } else if (days < 30) {
    return `${days}天前创建`
  } else {
    return date.toLocaleDateString()
  }
}