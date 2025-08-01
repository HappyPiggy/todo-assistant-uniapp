// 获取项目册列表

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
 * @param {boolean} options.archived_only 是否只返回归档项目册
 * @param {number} options.page 页码
 * @param {number} options.pageSize 每页大小
 * @param {string} options.keyword 搜索关键词
 * @returns {Object} 响应结果
 * 
 * 成功响应格式：
 * {
 *   success: true,
 *   data: {
 *     list: [
 *       {
 *         _id: "项目册ID",
 *         title: "项目册标题",
 *         description: "项目册描述",
 *         creator_id: "创建者ID",
 *         created_at: "创建时间",
 *         updated_at: "更新时间",
 *         sort_order: "排序序号",
 *         is_archived: false,
 *         member_count: 0,        // 成员数量
 *         item_count: 0,          // 任务总数
 *         completed_count: 0,     // 已完成任务数
 *         task_stats: {           // 详细任务统计
 *           total: 0,             // 总任务数
 *           todo: 0,              // 待办任务数
 *           in_progress: 0,       // 进行中任务数
 *           completed: 0          // 已完成任务数
 *         }
 *       }
 *     ],
 *     pagination: {
 *       page: 1,                  // 当前页码
 *       pageSize: 20,            // 每页大小
 *       total: 0,                // 总记录数
 *       totalPages: 0,           // 总页数
 *       hasMore: false           // 是否有更多数据
 *     }
 *   }
 * }
 * 
 * 失败响应格式：
 * {
 *   success: false,
 *   error: {
 *     code: "错误代码",
 *     message: "错误信息"
 *   }
 * }
 */
async function getTodoBooks(options = {}) {
  const { uid, db } = this
  
  const { 
    include_archived = false,
    archived_only = false,
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
    
    // 归档状态过滤逻辑
    if (archived_only) {
      // 只返回已归档的项目册
      whereCondition.is_archived = true
    } else if (!include_archived) {
      // 默认情况：只返回未归档的项目册
      whereCondition.is_archived = false
    }
    // 如果 include_archived=true 且 archived_only=false，则返回所有状态的项目册
    
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