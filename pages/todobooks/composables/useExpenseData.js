import { ref, computed } from 'vue'

/**
 * 消费统计数据处理
 */
export function useExpenseData() {
  // 原始任务数据
  const tasks = ref([])
  
  // 缓存计算结果
  const cachedResults = new Map()
  const cacheKey = (taskList, mode) => {
    return `${taskList.length}_${mode}_${taskList[0]?._id || ''}`
  }
  
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
  
  // 按标签分组统计（带缓存）
  const groupByTags = (taskList, mode = 'actual') => {
    console.log(`=== groupByTags开始 ===`)
    console.log(`模式: ${mode}`)
    console.log(`任务数量: ${taskList.length}`)
    
    // 检查缓存
    const key = cacheKey(taskList, mode)
    if (cachedResults.has(key)) {
      console.log(`使用缓存数据: ${key}`)
      return cachedResults.get(key)
    }
    
    const tagMap = new Map()
    
    taskList.forEach((task, index) => {
      // 跳过已删除的任务
      if (task.deleted_at) return
      
      // 获取任务的标签
      const taskTags = task.tags || []
      
      console.log(`任务${index}: ${task.title}`)
      console.log(`  预算: ${task.budget || 0}`)
      console.log(`  实际支出: ${task.actual_cost || 0}`)
      console.log(`  标签: ${JSON.stringify(taskTags)}`)
      
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
          // 每个标签都应该完整统计分配给它的任务金额
          const taskBudget = task.budget || 0
          const taskActualCost = task.actual_cost || 0
          console.log(`  添加到标签 "${tagName}": 预算+${taskBudget}, 支出+${taskActualCost}`)
          group.budget += taskBudget
          group.actualCost += taskActualCost
          
          // 只有任务不存在时才增加任务计数和添加到任务列表中
          if (!group.tasks.find(t => t._id === task._id)) {
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
    
    console.log(`=== 标签统计结果 (${mode}模式) ===`)
    console.log(`总计: ${total}`)
    
    // 计算每个标签的百分比
    groups.forEach(group => {
      const amount = mode === 'budget' ? group.budget : group.actualCost
      group.percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : '0'
      console.log(`标签 "${group.tagName}": ${mode === 'budget' ? '预算' : '支出'}=${amount}, 百分比=${group.percentage}%, 任务数=${group.taskCount}`)
    })
    
    // 缓存结果
    cachedResults.set(key, groups)
    
    // 限制缓存大小
    if (cachedResults.size > 10) {
      const firstKey = cachedResults.keys().next().value
      cachedResults.delete(firstKey)
    }
    
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