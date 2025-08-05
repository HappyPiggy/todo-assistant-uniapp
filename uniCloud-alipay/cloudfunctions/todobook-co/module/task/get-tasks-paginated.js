// 分页获取任务列表

const { createSuccessResponse, createErrorResponse } = require('../../common/utils')
const { checkTodoBookPermission } = require('../../lib/utils/permission')
const { ERROR_CODES, PERMISSION_TYPE } = require('../../common/constants')

/**
 * 分页获取任务列表
 * @param {Object} params 查询参数
 * @param {string} params.todobook_id 项目册ID
 * @param {number} params.page 页码（从1开始）
 * @param {number} params.pageSize 每页大小（默认20，最大100）
 * @param {string} params.filter 筛选条件 'all' | 'todo' | 'completed'
 * @param {Array} params.tags 标签筛选数组
 * @param {Object} params.sort 排序配置 { field: 'created_at' | 'updated_at' | 'tags', order: 'asc' | 'desc' }
 * @param {string} params.searchKeyword 搜索关键词
 * @returns {Object} 响应结果
 * 
 * 成功响应格式：
 * {
 *   code: 0,
 *   data: {
 *     tasks: [任务数组],
 *     pagination: {
 *       page: 1,
 *       pageSize: 20,
 *       total: 100, // 仅首页返回
 *       hasMore: true
 *     }
 *   }
 * }
 */
async function getTodoItemsPaginated(params) {
  const {
    todobook_id,
    page = 1,
    pageSize = 20,
    filter = 'all',
    tags = [],
    sort = { field: 'created_at', order: 'desc' },
    searchKeyword = ''
  } = params

  if (!todobook_id) {
    return createErrorResponse(ERROR_CODES.INVALID_PARAMS, '项目册ID不能为空')
  }

  // 验证分页参数
  const currentPage = Math.max(1, parseInt(page))
  const currentPageSize = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (currentPage - 1) * currentPageSize

  const { uid, db } = this

  try {
    // 权限检查
    const permissionResult = await checkTodoBookPermission(this, uid, todobook_id, PERMISSION_TYPE.READ)
    if (!permissionResult.success) {
      return permissionResult.error
    }

    // 构建查询条件
    const where = await buildQueryConditions(db, {
      todobook_id,
      filter,
      tags,
      searchKeyword
    })

    // 构建排序条件
    const orderBy = buildSortConditions(sort)

    // 执行分页查询
    let query = db.collection('todoitems')
      .where(where)

    // 应用排序
    for (const sortItem of orderBy) {
      query = query.orderBy(sortItem.field, sortItem.order)
    }

    // 应用分页
    const tasksResult = await query
      .skip(skip)
      .limit(currentPageSize)
      .get()

    // 获取总数（仅首页查询，优化性能）
    let total = undefined
    if (currentPage === 1) {
      const countResult = await db.collection('todoitems')
        .where(where)
        .count()
      total = countResult.total
    }

    // 处理任务数据，包括子任务
    const tasks = await processTasksData(db, tasksResult.data)

    // 判断是否还有更多数据
    const hasMore = tasksResult.data.length === currentPageSize

    const responseData = {
      tasks,
      pagination: {
        page: currentPage,
        pageSize: currentPageSize,
        hasMore,
        ...(total !== undefined && { total })
      }
    }

    console.log(`分页查询完成: 第${currentPage}页, ${tasks.length}条任务, 总数: ${total || '未计算'}`)
    
    return createSuccessResponse(responseData)

  } catch (error) {
    console.error('分页获取任务列表失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取任务列表失败')
  }
}

/**
 * 构建查询条件
 * @param {Object} db 数据库实例
 * @param {Object} params 查询参数
 * @returns {Object} 查询条件
 */
async function buildQueryConditions(db, params) {
  const { todobook_id, filter, tags, searchKeyword } = params

  // 基础查询条件：只查询主任务（非子任务）
  let where = {
    todobook_id,
    parent_id: db.command.exists(false) // 只查询父任务
  }

  // 状态筛选
  if (filter === 'todo') {
    where.status = 'todo'
  } else if (filter === 'completed') {
    where.status = 'completed'
  }
  // filter === 'all' 时不添加状态筛选

  // 标签筛选
  if (tags && tags.length > 0) {
    // 处理标签格式，支持字符串和对象格式
    const tagValues = tags.map(tag => {
      if (typeof tag === 'object' && tag.id) {
        return tag.id
      } else if (typeof tag === 'object' && tag.name) {
        return tag.name
      }
      return tag
    })

    where.tags = db.command.in(tagValues)
  }

  // 关键词搜索
  if (searchKeyword && searchKeyword.trim()) {
    const keyword = searchKeyword.trim()
    const regex = new RegExp(keyword, 'i')
    
    where = db.command.and([
      where,
      db.command.or([
        { title: regex },
        { description: regex }
      ])
    ])
  }

  return where
}

/**
 * 构建排序条件
 * @param {Object} sort 排序配置
 * @returns {Array} 排序条件数组
 */
function buildSortConditions(sort) {
  const { field = 'created_at', order = 'desc' } = sort

  const orderBy = []

  switch (field) {
    case 'created_at':
      orderBy.push({ field: 'created_at', order })
      break
    case 'updated_at':
      // updated_at可能为空，需要添加created_at作为备用排序
      orderBy.push({ field: 'updated_at', order })
      orderBy.push({ field: 'created_at', order })
      break
    case 'tags':
      // 按标签排序比较复杂，这里简化为按创建时间排序
      // 实际应用中可能需要在客户端进行标签分组排序
      orderBy.push({ field: 'created_at', order })
      break
    default:
      orderBy.push({ field: 'created_at', order })
  }

  return orderBy
}

/**
 * 处理任务数据，包括获取子任务
 * @param {Object} db 数据库实例
 * @param {Array} parentTasks 父任务数组
 * @returns {Array} 处理后的任务数组
 */
async function processTasksData(db, parentTasks) {
  if (!parentTasks || parentTasks.length === 0) {
    return []
  }

  // 获取所有父任务的ID
  const parentTaskIds = parentTasks.map(task => task._id)

  // 批量查询子任务
  const subtasksResult = await db.collection('todoitems')
    .where({
      parent_id: db.command.in(parentTaskIds)
    })
    .orderBy('sort_order', 'asc')
    .orderBy('created_at', 'asc')
    .get()

  // 将子任务按父任务ID分组
  const subtasksByParent = {}
  subtasksResult.data.forEach(subtask => {
    if (!subtasksByParent[subtask.parent_id]) {
      subtasksByParent[subtask.parent_id] = []
    }
    subtasksByParent[subtask.parent_id].push(subtask)
  })

  // 将子任务添加到父任务中
  const processedTasks = parentTasks.map(parentTask => {
    const subtasks = subtasksByParent[parentTask._id] || []
    
    return {
      ...parentTask,
      subtasks,
      expanded: false, // 默认折叠状态
      // 确保必要字段存在
      tags: Array.isArray(parentTask.tags) ? parentTask.tags : [],
      subtask_count: subtasks.length,
      completed_subtask_count: subtasks.filter(st => st.status === 'completed').length
    }
  })

  return processedTasks
}

module.exports = getTodoItemsPaginated