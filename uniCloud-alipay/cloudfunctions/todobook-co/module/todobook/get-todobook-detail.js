// 获取项目册详情

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkTodoBookPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 获取项目册详情
 * @param {string} bookId 项目册ID
 * @param {Object} options 查询选项
 * @param {boolean} options.includeMembers 是否包含成员信息（默认true）
 * @param {boolean} options.includeTasks 是否包含任务信息（默认true）
 * @param {boolean} options.includeBasic 是否包含基本信息（默认true）
 * @returns {Object} 响应结果
 * 
 * 成功响应格式：
 * {
 *   success: true,
 *   data: {
 *     book: {
 *       _id: "项目册ID",
 *       title: "项目册标题",
 *       description: "项目册描述",
 *       creator_id: "创建者用户ID",
 *       created_at: "创建时间",
 *       updated_at: "更新时间",
 *       color: "项目册颜色",
 *       icon: "项目册图标",
 *       is_shared: "是否共享",
 *       share_type: "共享类型(private/public/member)",
 *       member_count: "成员数量",
 *       item_count: "任务项数量",
 *       completed_count: "已完成任务数量",
 *       sort_order: "排序顺序",
 *       is_archived: "是否已归档",
 *       archived_at: "归档时间",
 *       last_activity_at: "最后活动时间"
 *     },
 *     members: [
 *       {
 *         _id: "成员记录ID",
 *         todobook_id: "项目册ID",
 *         user_id: "用户ID",
 *         role: "角色(owner/admin/member)",
 *         permissions: "权限列表",
 *         joined_at: "加入时间",
 *         invited_by: "邀请人用户ID",
 *         last_access_at: "最后访问时间",
 *         is_active: "是否活跃成员",
 *         nickname: "在此项目册中的昵称",
 *         notification_settings: "通知设置"
 *       }
 *     ],
 *     tasks: [
 *       {
 *         _id: "任务ID",
 *         todobook_id: "所属项目册ID",
 *         parent_id: "父任务ID",
 *         title: "任务标题",
 *         description: "任务描述",
 *         creator_id: "创建者用户ID",
 *         assignee_id: "指派给的用户ID",
 *         created_at: "创建时间",
 *         updated_at: "更新时间",
 *         due_date: "截止日期",
 *         completed_at: "完成时间",
 *         status: "状态(todo/in_progress/completed/cancelled)",
 *         priority: "优先级(low/medium/high/urgent)",
 *         tags: "标签列表",
 *         sort_order: "排序顺序",
 *         level: "层级(0-2)",
 *         progress: "进度百分比",
 *         estimated_hours: "预估工时",
 *         actual_hours: "实际工时",
 *         attachments: "附件列表",
 *         comments: "评论列表",
 *         subtask_count: "子任务数量",
 *         completed_subtask_count: "已完成子任务数量",
 *         is_recurring: "是否循环任务",
 *         recurrence_rule: "循环规则",
 *         last_activity_at: "最后活动时间"
 *       }
 *     ]
 *   }
 * }
 * 
 * 错误响应格式：
 * {
 *   success: false,
 *   error: {
 *     code: "错误码",
 *     message: "错误信息"
 *   }
 * }
 */
async function getTodoBookDetail(bookId, options = {}) {
  // 设置默认选项
  const {
    includeMembers = false,
    includeTasks = false,
    includeBasic = true
  } = options
  // 认证验证
  const authResult = await validateAuth(this)
  if (!authResult.success) {
    return authResult.error
  }
  
  const { uid } = authResult
  const db = getDatabase(this)
  
  try {
    // 权限检查
    const permissionResult = await checkTodoBookPermission(this, uid, bookId, PERMISSION_TYPE.READ)
    if (!permissionResult.success) {
      return permissionResult.error
    }
    
    // 构建查询数组
    const queries = []
    
    // 始终获取基本信息
    if (includeBasic) {
      queries.push(db.collection('todobooks').doc(bookId).get())
    }
    
    // 根据选项获取成员信息
    if (includeMembers) {
      queries.push(db.collection('todobook_members')
        .where({ todobook_id: bookId, is_active: true })
        .get())
    }
    
    // 根据选项获取任务信息
    if (includeTasks) {
      queries.push(db.collection('todoitems')
        .where({ todobook_id: bookId })
        .orderBy('sort_order', 'asc')
        .orderBy('created_at', 'desc')
        .get())
    }
    
    // 并行执行查询
    const results = await Promise.all(queries)
    
    // 解析查询结果
    let resultIndex = 0
    const responseData = {}
    
    // 解析基本信息
    if (includeBasic) {
      const bookDetailResult = results[resultIndex++]
      if (!bookDetailResult.data.length) {
        return createErrorResponse(ERROR_CODES.NOT_FOUND, '项目册不存在')
      }
      responseData.book = bookDetailResult.data[0]
    }
    
    // 解析成员信息
    if (includeMembers) {
      const membersResult = results[resultIndex++]
      responseData.members = membersResult.data
    }
    
    // 解析任务信息
    if (includeTasks) {
      const tasksResult = results[resultIndex++]
      responseData.tasks = tasksResult.data
    }
    
    // 更新最后访问时间
    await db.collection('todobook_members')
      .where({ todobook_id: bookId, user_id: uid })
      .update({ last_access_at: new Date() })
    
    return createSuccessResponse(responseData)
  } catch (error) {
    console.error('获取项目册详情失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取项目册详情失败')
  }
}

module.exports = getTodoBookDetail