import { ref, computed } from 'vue'

/**
 * 消费统计数据处理
 */
export function useExpenseData() {
  // 原始任务数据
  const tasks = ref([])
  
  // 计算总预算和总支出
  const calculateTotals = (taskList) => {
    let totalBudget = 0
    let totalActualCost = 0
    
    taskList.forEach(task => {
      // 只统计未删除的任务
      if (!task.deleted_at) {
        totalBudget += task.budget || 0
        totalActualCost += task.actual_cost || 0
      }
    })
    
    return {
      totalBudget,
      totalActualCost
    }
  }
  
  // 按标签分组统计
  const groupByTags = (taskList, mode = 'actual') => {
    const tagMap = new Map()
    
    taskList.forEach(task => {
      // 跳过已删除的任务
      if (task.deleted_at) return
      
      // 获取任务的标签
      const taskTags = task.tags || []
      
      if (taskTags.length === 0) {
        // 无标签的任务归类到"未分类"
        const key = 'untagged'
        if (!tagMap.has(key)) {
          tagMap.set(key, {
            tagId: key,
            tagName: '未分类',
            tagColor: '#999999',
            budget: 0,
            actualCost: 0,
            taskCount: 0,
            tasks: []
          })
        }
        const group = tagMap.get(key)
        group.budget += task.budget || 0
        group.actualCost += task.actual_cost || 0
        group.taskCount++
        group.tasks.push(task)
      } else {
        // 处理有标签的任务
        taskTags.forEach(tag => {
          // 兼容字符串和对象格式的标签
          const tagId = typeof tag === 'string' ? tag : tag.id
          const tagName = typeof tag === 'string' ? tag : tag.name
          const tagColor = typeof tag === 'object' ? tag.color : getTagColor(tagId)
          
          if (!tagMap.has(tagId)) {
            tagMap.set(tagId, {
              tagId,
              tagName,
              tagColor,
              budget: 0,
              actualCost: 0,
              taskCount: 0,
              tasks: []
            })
          }
          
          const group = tagMap.get(tagId)
          // 每个标签只计算一次任务的金额（避免重复计算）
          if (!group.tasks.find(t => t._id === task._id)) {
            group.budget += task.budget || 0
            group.actualCost += task.actual_cost || 0
            group.taskCount++
            group.tasks.push(task)
          }
        })
      }
    })
    
    // 转换为数组并计算百分比
    const groups = Array.from(tagMap.values())
    const total = groups.reduce((sum, group) => {
      return sum + (mode === 'budget' ? group.budget : group.actualCost)
    }, 0)
    
    // 计算每个标签的百分比
    groups.forEach(group => {
      const amount = mode === 'budget' ? group.budget : group.actualCost
      group.percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : '0'
    })
    
    return groups
  }
  
  // 按金额排序（从高到低）
  const sortByAmount = (tagGroups, mode = 'actual') => {
    const field = mode === 'budget' ? 'budget' : 'actualCost'
    return tagGroups.sort((a, b) => (b[field] || 0) - (a[field] || 0))
  }
  
  // 获取标签默认颜色
  const getTagColor = (tagId) => {
    const colors = [
      '#007aff', '#34c759', '#ff9500', '#ff3b30', '#5856d6',
      '#af52de', '#ff2d55', '#5ac8fa', '#ffcc00', '#ff6b6b'
    ]
    // 使用标签ID的哈希值来选择颜色
    let hash = 0
    for (let i = 0; i < tagId.length; i++) {
      hash = tagId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }
  
  // 计算消费统计数据
  const calculateExpenseData = (taskList) => {
    tasks.value = taskList || []
    
    // 计算总额
    const totals = calculateTotals(tasks.value)
    
    // 按标签分组（实际支出）
    const actualGroups = groupByTags(tasks.value, 'actual')
    const sortedActualGroups = sortByAmount(actualGroups, 'actual')
    
    // 按标签分组（预算）
    const budgetGroups = groupByTags(tasks.value, 'budget')
    const sortedBudgetGroups = sortByAmount(budgetGroups, 'budget')
    
    return {
      totalBudget: totals.totalBudget,
      totalActualCost: totals.totalActualCost,
      actualTagGroups: sortedActualGroups,
      budgetTagGroups: sortedBudgetGroups
    }
  }
  
  // 导出的计算属性
  const totalBudget = computed(() => {
    return calculateTotals(tasks.value).totalBudget
  })
  
  const totalExpense = computed(() => {
    return calculateTotals(tasks.value).totalActualCost
  })
  
  return {
    tasks,
    totalBudget,
    totalExpense,
    calculateTotals,
    groupByTags,
    sortByAmount,
    calculateExpenseData
  }
}