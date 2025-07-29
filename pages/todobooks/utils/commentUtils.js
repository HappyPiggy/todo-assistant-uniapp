/**
 * 评论显示改进功能的工具函数和测试验证
 */

import { getTaskCommentCount } from '@/utils/commentUtils.js'

/**
 * 验证TaskItem组件的评论显示逻辑
 * @param {Object} task - 任务对象
 * @param {Number} unreadCommentCount - 未读评论数
 * @returns {Object} 验证结果
 */
export function validateCommentDisplay(task, unreadCommentCount) {
  const validation = {
    success: true,
    errors: [],
    warnings: [],
    results: {}
  }

  try {
    // 验证评论总数计算 - 使用统一的计数函数
    const commentCount = getTaskCommentCount(task, true)
    validation.results.commentCount = commentCount
    
    // 验证显示文本格式
    const commentDisplayText = commentCount > 0 ? `${commentCount}条评论` : ''
    validation.results.commentDisplayText = commentDisplayText
    
    // 验证未读状态
    const hasUnreadComments = (unreadCommentCount || 0) > 0
    validation.results.hasUnreadComments = hasUnreadComments
    
    // 验证显示条件
    const shouldShowCommentInfo = commentCount > 0 || hasUnreadComments
    validation.results.shouldShowCommentInfo = shouldShowCommentInfo
    
    // 验证要求1: 评论总数显示
    if (commentCount > 0 && !commentDisplayText) {
      validation.errors.push('要求1失败: 有评论时应显示评论总数')
      validation.success = false
    }
    
    if (commentCount === 0 && commentDisplayText) {
      validation.errors.push('要求1失败: 无评论时不应显示评论文本')
      validation.success = false
    }
    
    // 验证要求2: 未读状态显示
    if (unreadCommentCount > 0 && !hasUnreadComments) {
      validation.errors.push('要求2失败: 有未读评论时应显示红点提示')
      validation.success = false
    }
    
    if (unreadCommentCount === 0 && hasUnreadComments) {
      validation.errors.push('要求2失败: 无未读评论时不应显示红点提示')
      validation.success = false
    }
    
    // 验证要求4: 性能优化
    if (typeof task?.comments?.length !== 'number' && task?.comments !== undefined) {
      validation.warnings.push('要求4警告: comments不是数组，可能影响性能')
    }
    
    console.log('评论显示验证结果:', validation)
    return validation
    
  } catch (error) {
    validation.success = false
    validation.errors.push(`验证过程异常: ${error.message}`)
    console.error('评论显示验证失败:', error)
    return validation
  }
}

/**
 * 测试不同场景下的评论显示
 */
export function runCommentDisplayTests() {
  const testCases = [
    {
      name: '场景1: 有评论有未读',
      task: {
        _id: 'test1',
        title: '测试任务1',
        comments: [
          { _id: 'c1', content: '评论1' },
          { _id: 'c2', content: '评论2' },
          { _id: 'c3', content: '评论3' }
        ]
      },
      unreadCommentCount: 2,
      expected: {
        commentCount: 3,
        commentDisplayText: '3条评论',
        hasUnreadComments: true,
        shouldShowCommentInfo: true
      }
    },
    {
      name: '场景2: 有评论无未读',
      task: {
        _id: 'test2',
        title: '测试任务2',
        comments: [
          { _id: 'c4', content: '评论4' },
          { _id: 'c5', content: '评论5' }
        ]
      },
      unreadCommentCount: 0,
      expected: {
        commentCount: 2,
        commentDisplayText: '2条评论',
        hasUnreadComments: false,
        shouldShowCommentInfo: true
      }
    },
    {
      name: '场景3: 无评论无未读',
      task: {
        _id: 'test3',
        title: '测试任务3',
        comments: []
      },
      unreadCommentCount: 0,
      expected: {
        commentCount: 0,
        commentDisplayText: '',
        hasUnreadComments: false,
        shouldShowCommentInfo: false
      }
    },
    {
      name: '场景4: 无评论有未读(异常情况)',
      task: {
        _id: 'test4',
        title: '测试任务4',
        comments: []
      },
      unreadCommentCount: 1,
      expected: {
        commentCount: 0,
        commentDisplayText: '',
        hasUnreadComments: true,
        shouldShowCommentInfo: true
      }
    },
    {
      name: '场景5: 边界情况 - undefined comments',
      task: {
        _id: 'test5',
        title: '测试任务5'
        // comments字段缺失
      },
      unreadCommentCount: 0,
      expected: {
        commentCount: 0,
        commentDisplayText: '',
        hasUnreadComments: false,
        shouldShowCommentInfo: false
      }
    }
  ]

  const results = []
  
  testCases.forEach(testCase => {
    console.log(`\n运行测试: ${testCase.name}`)
    const validation = validateCommentDisplay(testCase.task, testCase.unreadCommentCount)
    
    // 检查结果是否符合预期
    const resultMatches = JSON.stringify(validation.results) === JSON.stringify(testCase.expected)
    
    results.push({
      name: testCase.name,
      passed: validation.success && resultMatches,
      validation,
      expected: testCase.expected,
      actual: validation.results
    })
    
    if (resultMatches) {
      console.log(`✅ ${testCase.name} - 通过`)
    } else {
      console.log(`❌ ${testCase.name} - 失败`)
      console.log('期望:', testCase.expected)
      console.log('实际:', validation.results)
    }
  })
  
  const passedCount = results.filter(r => r.passed).length
  console.log(`\n测试总结: ${passedCount}/${testCases.length} 个测试通过`)
  
  return results
}

// 自动运行测试（开发环境）
if (process.env.NODE_ENV === 'development') {
  // 延迟执行，避免在模块加载时立即运行
  setTimeout(() => {
    runCommentDisplayTests()
  }, 1000)
}