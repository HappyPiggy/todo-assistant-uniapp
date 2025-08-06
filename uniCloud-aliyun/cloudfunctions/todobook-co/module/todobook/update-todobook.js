// 更新项目册

const { 
  createSuccessResponse, 
  createErrorResponse, 
  validateStringParam 
} = require('../../common/utils')
const { checkTodoBookPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 更新项目册
 * @param {string} bookId 项目册ID
 * @param {Object} updateData 更新数据
 * @param {string} updateData.title 项目册标题
 * @param {string} updateData.description 项目册描述
 * @param {string} updateData.color 项目册颜色
 * @param {string} updateData.icon 项目册图标
 * @param {boolean} updateData.is_archived 是否归档
 * @param {Date} updateData.archived_at 归档时间
 * @returns {Object} 响应结果
 */
async function updateTodoBook(bookId, updateData) {
  const { uid, db } = this
  
  try {
    // 权限检查
    const permissionResult = await checkTodoBookPermission(this, uid, bookId, PERMISSION_TYPE.WRITE)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    const { title, description, color, icon, is_archived, archived_at } = updateData
    const updates = {
      updated_at: new Date()
    }
    
    // 验证和更新标题
    if (title !== undefined) {
      const titleValidation = validateStringParam(title, '项目册标题', 1, 100)
      if (titleValidation) {
        return titleValidation
      }
      
      const trimmedTitle = title.trim()
      
      // 检查同用户是否已有同名项目册（排除当前项目册）
      const existingBookCheck = await db.collection('todobooks')
        .where({
          title: trimmedTitle,
          creator_id: uid,
          is_archived: false,
          _id: db.command.neq(bookId)
        })
        .count()
      
      if (existingBookCheck.total > 0) {
        return createErrorResponse(ERROR_CODES.INVALID_PARAM, '您已有同名项目册，请使用其他名称')
      }
      
      updates.title = trimmedTitle
    }
    
    // 更新其他字段
    if (description !== undefined) updates.description = description
    if (color !== undefined) updates.color = color
    if (icon !== undefined) updates.icon = icon
    
    // 处理归档状态
    if (is_archived !== undefined) {
      updates.is_archived = is_archived
      // 如果设置为归档，记录归档时间
      if (is_archived && archived_at !== undefined) {
        updates.archived_at = archived_at
      }
      // 如果取消归档，清除归档时间
      else if (!is_archived) {
        updates.archived_at = null
      }
    }
    
    // 执行更新
    await db.collection('todobooks')
      .doc(bookId)
      .update(updates)
    
    // 查询更新后的数据
    const updatedBook = await db.collection('todobooks')
      .doc(bookId)
      .get()
    
    return createSuccessResponse(updatedBook.data[0], '更新项目册成功')
  } catch (error) {
    console.error('更新项目册失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '更新项目册失败')
  }
}

module.exports = updateTodoBook