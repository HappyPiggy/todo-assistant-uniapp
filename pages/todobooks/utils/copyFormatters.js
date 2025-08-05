/**
 * 内容格式化工具函数
 * 用于格式化任务、评论等内容以便复制到剪贴板
 */

/**
 * 格式化日期时间
 * @param {string|number|Date} timestamp - 时间戳或日期对象
 * @returns {string} 格式化后的时间字符串
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return '未设置'
  
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return '未设置'
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}年${month}月${day}日 ${hour}:${minute}`
}

/**
 * 格式化任务信息
 * @param {Object} task - 任务对象
 * @returns {string} 格式化后的任务信息文本
 */
export const formatTaskInfo = (task) => {
  if (!task) return ''
  
  const lines = []
  const MAX_LENGTH = 5000
  
  // 任务标题
  lines.push(`【任务标题】${task.title || '未命名任务'}`)
  
  // 任务描述
  if (task.description) {
    lines.push(`【描述】${task.description}`)
  }
  
  // 标签
  if (task.tags && task.tags.length > 0) {
    const tagNames = task.tags.map(tag => 
      typeof tag === 'string' ? tag : (tag.name || tag.tag_name || '未知标签')
    ).join('、')
    lines.push(`【标签】${tagNames}`)
  }
  
  // 截止日期
  if (task.due_date) {
    lines.push(`【截止日期】${formatDateTime(task.due_date)}`)
  }
  
  // 预算
  if (task.budget !== null && task.budget !== undefined) {
    lines.push(`【预算】¥${task.budget}`)
  }
  
  // 实际花费
  if (task.actual_cost !== null && task.actual_cost !== undefined) {
    lines.push(`【实际花费】¥${task.actual_cost}`)
  }
  
  // 创建时间
  if (task.created_at) {
    lines.push(`【创建时间】${formatDateTime(task.created_at)}`)
  }
  
  // 子任务
  if (task.children && task.children.length > 0) {
    lines.push('【子任务】')
    task.children.forEach((child, index) => {
      // 递归格式化子任务，但只保留标题
      lines.push(`  ${index + 1}. ${child.title || '未命名子任务'}`)
    })
  }
  
  // 组合所有行
  let result = lines.join('\n')
  
  // 检查长度限制
  if (result.length > MAX_LENGTH) {
    result = result.substring(0, MAX_LENGTH) + '\n...[内容已截断]'
  }
  
  return result
}

/**
 * 格式化评论信息
 * @param {Object} comment - 评论对象
 * @returns {string} 格式化后的评论信息文本
 */
export const formatCommentInfo = (comment) => {
  if (!comment) return ''
  
  const lines = []
  
  // 评论者
  const authorName = comment.user_info?.nickname || 
                    comment.author_name || 
                    comment.user_id || 
                    '匿名用户'
  lines.push(`【评论者】${authorName}`)
  
  // 时间
  if (comment.created_at) {
    lines.push(`【时间】${formatDateTime(comment.created_at)}`)
  }
  
  // 内容
  let content = comment.content || ''
  
  // 处理内容中的图片和附件标记
  // 替换图片标记
  content = content.replace(/\[图片\]/g, '[图片]')
  content = content.replace(/<img[^>]*>/g, '[图片]')
  
  // 替换附件标记
  content = content.replace(/\[附件:[^\]]+\]/g, '[附件]')
  content = content.replace(/<a[^>]*class="attachment"[^>]*>[^<]*<\/a>/g, '[附件]')
  
  lines.push(`【内容】${content}`)
  
  return lines.join('\n')
}

/**
 * 格式化子任务列表（扁平化）
 * @param {Array} subtasks - 子任务数组
 * @param {number} level - 缩进级别
 * @returns {Array} 格式化后的子任务行数组
 */
export const formatSubtasks = (subtasks, level = 1) => {
  if (!subtasks || subtasks.length === 0) return []
  
  const lines = []
  const indent = '  '.repeat(level)
  
  subtasks.forEach((task, index) => {
    lines.push(`${indent}${index + 1}. ${task.title || '未命名任务'}`)
    
    // 递归处理子任务的子任务
    if (task.children && task.children.length > 0) {
      lines.push(...formatSubtasks(task.children, level + 1))
    }
  })
  
  return lines
}