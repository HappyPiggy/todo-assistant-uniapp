// 获取项目册列表

const { validateAuth, getDatabase } = require('../../lib/utils/auth')
const { 
  createSuccessResponse, 
  createErrorResponse, 
  validatePaginationParams,
  createSearchRegex
} = require('../../common/utils')
const { 
  getTodoBookTaskStats, 
  getTodoBookMemberCount 
} = require('../../lib/utils/database')
const { ERROR_CODES } = require('../../common/constants')

/**
 * 获取用户的项目册列表
 * @param {Object} options 选项参数
 * @param {boolean} options.include_archived 是否包含归档项目册
 * @param {number} options.page 页码
 * @param {number} options.pageSize 每页大小
 * @param {string} options.keyword 搜索关键词
 * @returns {Object} 响应结果
 */
async function getTodoBooks(options = {}) {
  // 认证验证
  const authResult = await validateAuth(this)
  if (!authResult.success) {
    return authResult.error
  }
  
  const { uid } = authResult
  const db = getDatabase(this)
  
  const { 
    include_archived = false, 
    page = 1,
    pageSize = 20,
    keyword = ''
  } = options
  
  // 参数验证
  const paginationParams = validatePaginationParams(page, pageSize)
  const { page: validPage, pageSize: validPageSize } = paginationParams
  
  try {
    // 先获取用户参与的项目册ID列表
    const memberResult = await db.collection('todobook_members')
      .where({ user_id: uid, is_active: true })
      .field({ todobook_id: true })
      .get()
    
    const memberBookIds = memberResult.data.map(item => item.todobook_id)
    
    // 构建查询条件
    const whereCondition = {
      $or: [
        { creator_id: uid }
      ]
    }
    
    // 添加成员项目册
    if (memberBookIds.length > 0) {
      whereCondition.$or.push({ _id: db.command.in(memberBookIds) })
    }
    
    // 归档状态
    if (!include_archived) {
      whereCondition.is_archived = false
    }
    
    // 搜索条件 - 仅搜索项目册标题，精确包含匹配
    if (keyword && keyword.trim()) {
      const trimmedKeyword = keyword.trim()
      whereCondition.$and = [{
        title: createSearchRegex(trimmedKeyword)
      }]
    }
    
    // 创建查询对象
    const query = db.collection('todobooks').where(whereCondition)
    
    // 并行执行查询数据和总数
    const [dataResult, countResult] = await Promise.all([
      query
        .orderBy('sort_order', 'asc')
        .orderBy('updated_at', 'desc')
        .skip((validPage - 1) * validPageSize)
        .limit(validPageSize)
        .get(),
      query.count()
    ])
    
    // 获取每个项目册的成员信息和任务统计
    const todoBooks = await Promise.all(
      dataResult.data.map(async (book) => {
        const [memberCountResult, taskStatsResult] = await Promise.all([
          getTodoBookMemberCount(this, book._id),
          getTodoBookTaskStats(this, book._id)
        ])
        
        return {
          ...book,
          member_count: memberCountResult.success ? memberCountResult.count : 0,
          item_count: taskStatsResult.success ? taskStatsResult.stats.total : 0,
          completed_count: taskStatsResult.success ? taskStatsResult.stats.completed : 0,
          task_stats: taskStatsResult.success ? taskStatsResult.stats : {
            total: 0,
            todo: 0,
            in_progress: 0,
            completed: 0
          }
        }
      })
    )
    
    // 返回分页数据
    return createSuccessResponse({
      list: todoBooks,
      pagination: {
        page: validPage,
        pageSize: validPageSize,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / validPageSize),
        hasMore: dataResult.data.length === validPageSize
      }
    })
  } catch (error) {
    console.error('获取项目册列表失败:', error)
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '获取项目册列表失败')
  }
}

module.exports = getTodoBooks