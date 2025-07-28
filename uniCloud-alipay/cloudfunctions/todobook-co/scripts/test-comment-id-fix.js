/**
 * 测试评论ID修复逻辑
 * 这个脚本用于测试updateCommentIds函数的正确性
 */

/**
 * 测试updateCommentIds函数
 */
function testUpdateCommentIds() {
  console.log('🧪 [测试] 开始测试updateCommentIds函数')
  
  // 模拟原始评论数据（使用旧任务ID）
  const oldTaskId = '6881ed46035dda0fd0c9fb9a'
  const newTaskId = '7992fe57146ebb1ae1d4gc5b'
  
  const originalComments = [
    {
      _id: '6881ed46035dda0fd0c9fb9a_1753350099845_313s2y6cs',
      user_id: 'anonymous_user_A',
      content: '这是第一条评论',
      created_at: new Date('2024-12-23T16:01:39.845Z'),
      reply_to: null
    },
    {
      _id: '6881ed46035dda0fd0c9fb9a_1753350150123_abc3d4f5g',
      user_id: 'anonymous_user_B', 
      content: '这是对第一条评论的回复',
      created_at: new Date('2024-12-23T16:02:30.123Z'),
      reply_to: '6881ed46035dda0fd0c9fb9a_1753350099845_313s2y6cs'
    },
    {
      _id: '6881ed46035dda0fd0c9fb9a_1753350200456_xyz7h8i9j',
      user_id: 'anonymous_user_A',
      content: '这是第三条评论',
      created_at: new Date('2024-12-23T16:03:20.456Z'),
      reply_to: null
    }
  ]
  
  // 实现updateCommentIds函数的测试版本
  const updateCommentIds = (comments, newTaskId) => {
    if (!comments || !Array.isArray(comments)) return []
    
    const commentIdMapping = new Map()
    
    // 第一轮：生成新的评论ID并建立映射关系
    const updatedComments = comments.map(comment => {
      const updatedComment = { ...comment }
      
      // 从原评论ID中提取时间戳和随机字符串部分
      const commentParts = comment._id.split('_')
      if (commentParts.length >= 3) {
        const timestamp = commentParts[1]
        const random = commentParts[2]
        const newCommentId = `${newTaskId}_${timestamp}_${random}`
        
        // 记录映射关系
        commentIdMapping.set(comment._id, newCommentId)
        updatedComment._id = newCommentId
        
        console.log(`🧪 [测试] 评论ID更新: ${comment._id} -> ${newCommentId}`)
      }
      
      return updatedComment
    })
    
    // 第二轮：更新reply_to字段中的评论ID引用
    return updatedComments.map(comment => {
      if (comment.reply_to && commentIdMapping.has(comment.reply_to)) {
        const oldReplyTo = comment.reply_to
        comment.reply_to = commentIdMapping.get(comment.reply_to)
        console.log(`🧪 [测试] 回复关系更新: ${oldReplyTo} -> ${comment.reply_to}`)
      }
      return comment
    })
  }
  
  // 执行测试
  console.log('🧪 [测试] 原始评论数据:')
  originalComments.forEach((comment, index) => {
    console.log(`  评论${index + 1}: ${comment._id}`)
    if (comment.reply_to) {
      console.log(`    回复: ${comment.reply_to}`)
    }
  })
  
  const updatedComments = updateCommentIds(originalComments, newTaskId)
  
  console.log('🧪 [测试] 更新后评论数据:')
  updatedComments.forEach((comment, index) => {
    console.log(`  评论${index + 1}: ${comment._id}`)
    if (comment.reply_to) {
      console.log(`    回复: ${comment.reply_to}`)
    }
  })
  
  // 验证结果
  let testPassed = true
  const expectedResults = [
    `${newTaskId}_1753350099845_313s2y6cs`,
    `${newTaskId}_1753350150123_abc3d4f5g`, 
    `${newTaskId}_1753350200456_xyz7h8i9j`
  ]
  
  console.log('🧪 [测试] 验证结果:')
  
  // 验证评论ID是否正确更新
  for (let i = 0; i < updatedComments.length; i++) {
    const expected = expectedResults[i]
    const actual = updatedComments[i]._id
    if (expected === actual) {
      console.log(`  ✅ 评论${i + 1} ID正确: ${actual}`)
    } else {
      console.log(`  ❌ 评论${i + 1} ID错误: 期望 ${expected}, 实际 ${actual}`)
      testPassed = false
    }
  }
  
  // 验证回复关系是否正确更新
  if (updatedComments[1].reply_to === updatedComments[0]._id) {
    console.log('  ✅ 回复关系正确更新')
  } else {
    console.log(`  ❌ 回复关系更新错误: 期望 ${updatedComments[0]._id}, 实际 ${updatedComments[1].reply_to}`)
    testPassed = false
  }
  
  // 验证第三条评论没有回复关系
  if (updatedComments[2].reply_to === null) {
    console.log('  ✅ 无回复关系的评论保持正确')
  } else {
    console.log(`  ❌ 无回复关系的评论错误: 应为null, 实际 ${updatedComments[2].reply_to}`)
    testPassed = false
  }
  
  console.log(`🧪 [测试] 测试${testPassed ? '通过' : '失败'}`)
  return testPassed
}

// 运行测试
if (require.main === module) {
  testUpdateCommentIds()
}

module.exports = {
  testUpdateCommentIds
}