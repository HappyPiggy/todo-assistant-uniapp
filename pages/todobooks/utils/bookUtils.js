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
 * 验证颜色值是否有效
 * @param {string} color - 颜色值
 * @returns {boolean} 是否有效
 */
export function isValidColor(color) {
  return BOOK_CONSTANTS.COLOR_OPTIONS.some(option => option.value === color)
}

/**
 * 验证图标值是否有效
 * @param {string} icon - 图标值
 * @returns {boolean} 是否有效
 */
export function isValidIcon(icon) {
  return BOOK_CONSTANTS.ICON_OPTIONS.some(option => option.value === icon)
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
 * 生成项目册预览数据
 * @param {Object} formData - 表单数据
 * @returns {Object} 预览数据
 */
export function generateBookPreview(formData) {
  return {
    title: formData.title || '项目册名称',
    description: formData.description || '项目描述',
    color: formData.color || BOOK_CONSTANTS.DEFAULT_COLOR,
    icon: formData.icon || BOOK_CONSTANTS.DEFAULT_ICON,
    stats: {
      total: 0,
      completed: 0,
      members: 1,
      progress: 0
    }
  }
}

/**
 * 验证项目册表单数据
 * @param {Object} formData - 表单数据
 * @returns {Object} 验证结果
 */
export function validateBookForm(formData) {
  const errors = {}
  
  // 验证标题
  if (!formData.title || !formData.title.trim()) {
    errors.title = '请输入项目册名称'
  } else if (formData.title.trim().length > 100) {
    errors.title = '项目册名称不能超过100个字符'
  }
  
  // 验证描述
  if (formData.description && formData.description.length > 500) {
    errors.description = '项目描述不能超过500个字符'
  }
  
  // 验证颜色
  if (formData.color && !isValidColor(formData.color)) {
    errors.color = '请选择有效的颜色'
  }
  
  // 验证图标
  if (formData.icon && !isValidIcon(formData.icon)) {
    errors.icon = '请选择有效的图标'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
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