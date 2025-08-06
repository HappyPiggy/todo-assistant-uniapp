// 创建项目册

const { 
  createSuccessResponse, 
  createErrorResponse, 
  validateStringParam 
} = require('../../common/utils')
const { ERROR_CODES, MEMBER_ROLE, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 创建项目册
 * @param {Object} bookData 项目册数据
 * @param {string} bookData.title 项目册标题
 * @param {string} bookData.description 项目册描述
 * @param {string} bookData.color 项目册颜色
 * @param {string} bookData.icon 项目册图标
 * @returns {Object} 响应结果
 */
async function createTodoBook(bookData) {
  // uid 和 db 已由 index.obj.js 的 _before & _beforeEach 注入
  const { uid, db } = this

  console.log("createTodoBook ", uid)
  
  // 数据验证
  const { title, description = '', color = '#007AFF', icon = 'folder' } = bookData
  
  // 验证标题
  const titleValidation = validateStringParam(title, '项目册标题', 1, 100)
  if (titleValidation) {
    return titleValidation
  }
  
  const trimmedTitle = title.trim()
  
  try {
    // 检查同用户是否已有同名项目册
    const existingBookCheck = await db.collection('todobooks')
      .where({
        title: trimmedTitle,
        creator_id: uid,
        is_archived: false
      })
      .count()
    
    if (existingBookCheck.total > 0) {
      return createErrorResponse(ERROR_CODES.INVALID_PARAM, '您已有同名项目册，请使用其他名称')
    }
    
    const now = new Date()
    const newBook = {
      title: trimmedTitle,
      description,
      creator_id: uid,
      created_at: now,
      updated_at: now,
      color,
      icon,
      member_count: 1,
      item_count: 0,
      completed_count: 0,
      sort_order: 0,
      is_archived: false,
      last_activity_at: now
    }
    
    // 创建项目册
    const result = await db.collection('todobooks').add(newBook)
    
    // 添加创建者为所有者
    await db.collection('todobook_members').add({
      todobook_id: result.id,
      user_id: uid,
      role: MEMBER_ROLE.OWNER,
      permissions: [
        PERMISSION_TYPE.READ, 
        PERMISSION_TYPE.WRITE, 
        PERMISSION_TYPE.DELETE, 
        PERMISSION_TYPE.MANAGE_MEMBERS, 
        PERMISSION_TYPE.MANAGE_SETTINGS
      ],
      joined_at: now,
      last_access_at: now,
      is_active: true
    })
    
    return createSuccessResponse({
      _id: result.id,
      ...newBook
    }, '创建项目册成功')
  } catch (error) {
    console.error('创建项目册失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '创建项目册失败')
  }
}

module.exports = createTodoBook