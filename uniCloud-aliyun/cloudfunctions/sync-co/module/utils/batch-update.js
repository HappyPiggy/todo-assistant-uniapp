// 批量更新工具函数

/**
 * 批量处理数据库记录
 * @param {Object} options 配置选项
 * @param {Object} options.collection 数据库集合
 * @param {Object} options.where 查询条件
 * @param {Number} options.batchSize 每批处理数量，默认500
 * @param {Function} options.processRecord 处理单条记录的函数
 * @param {String} options.operation 操作描述（用于日志）
 * @returns {Object} 处理结果
 */
async function batchProcess(options) {
  const { 
    collection, 
    where, 
    batchSize = 500, 
    processRecord,
    operation = '批量处理'
  } = options
  
  let skip = 0
  let totalCount = 0
  let successCount = 0
  let failCount = 0
  let hasMore = true
  const errors = []
  
  try {
    // 先获取总数
    console.log(`[batchProcess] 开始${operation}，查询条件:`, JSON.stringify(where, null, 2))
    const countRes = await collection.where(where).count()
    const total = countRes.total || 0
    console.log(`[batchProcess] 查询结果:`, { total, countRes })
    
    if (total === 0) {
      console.log(`[batchProcess] 没有找到符合条件的记录`)
      return {
        success: true,
        totalCount: 0,
        successCount: 0,
        failCount: 0,
        hasMore: false
      }
    }
    
    console.log(`[batchProcess] ${operation}: 共找到 ${total} 条记录需要处理`)
    
    // 分批处理
    while (hasMore) {
      // 获取当前批次数据
      console.log(`[batchProcess] 获取第 ${Math.floor(skip/batchSize) + 1} 批数据，skip: ${skip}, limit: ${batchSize}`)
      const batchRes = await collection
        .where(where)
        .skip(skip)
        .limit(batchSize)
        .get()
      
      const records = batchRes.data || []
      console.log(`[batchProcess] 获取到 ${records.length} 条记录`)
      
      if (records.length === 0) {
        console.log(`[batchProcess] 没有更多记录，结束处理`)
        hasMore = false
        break
      }
      
      console.log(`[batchProcess] 处理第 ${Math.floor(skip/batchSize) + 1} 批，共 ${records.length} 条记录`)
      
      // 处理当前批次
      const promises = records.map(async (record) => {
        try {
          await processRecord(record)
          return { success: true }
        } catch (error) {
          return { 
            success: false, 
            error: error.message,
            recordId: record._id 
          }
        }
      })
      
      const results = await Promise.allSettled(promises)
      
      // 统计结果
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++
        } else {
          failCount++
          if (result.reason || (result.value && !result.value.success)) {
            errors.push({
              recordId: records[index]._id,
              error: result.reason || result.value.error
            })
          }
        }
      })
      
      totalCount += records.length
      skip += batchSize
      
      // 如果处理的记录数少于批次大小，说明已经是最后一批
      if (records.length < batchSize) {
        hasMore = false
      }
    }
    
    // 记录错误详情（只记录前10个）
    if (errors.length > 0) {
      console.error(`${operation}错误详情（前10个）:`, errors.slice(0, 10))
    }
    
    return {
      success: failCount === 0,
      totalCount,
      successCount,
      failCount,
      hasMore: false,
      errors: errors.slice(0, 10) // 只返回前10个错误
    }
    
  } catch (error) {
    console.error(`${operation}失败:`, error)
    throw error
  }
}

/**
 * 使用数据库命令批量更新记录
 * @param {Object} options 配置选项
 * @param {Object} options.db 数据库实例
 * @param {String} options.collection 集合名称
 * @param {Object} options.where 查询条件
 * @param {Object} options.updateData 更新数据
 * @param {String} options.operation 操作描述
 * @returns {Object} 更新结果
 */
async function batchUpdate(options) {
  const { db, collection, where, updateData, operation = '批量更新' } = options
  
  try {
    const dbCmd = db.command
    
    // 执行批量更新
    const result = await db.collection(collection)
      .where(where)
      .update(updateData)
    
    console.log(`${operation}结果:`, {
      updated: result.updated,
      code: result.code,
      message: result.message
    })
    
    return {
      success: result.code === 0,
      updatedCount: result.updated || 0,
      message: result.message
    }
    
  } catch (error) {
    console.error(`${operation}失败:`, error)
    throw error
  }
}

module.exports = {
  batchProcess,
  batchUpdate
}