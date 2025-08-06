import { ref, computed, reactive } from 'vue'

/**
 * 消费统计数据处理（增强版，支持交互功能）
 */
export function useExpenseData() {
  // 原始任务数据
  const tasks = ref([])
  
  // 交互状态管理
  const interactionState = reactive({
    selectedSegment: null,        // 当前选中的扇形ID
    centerMode: 'total',          // 中心显示模式: 'total' | 'category'
    hoveredSegment: null,         // 悬停的扇形ID
    isAnimating: false,           // 是否正在动画中
    lastClickTime: 0              // 上次点击时间（防抖）
  })
  
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
    
    // 检查缓存
    const key = cacheKey(taskList, mode)
    if (cachedResults.has(key)) {
      return cachedResults.get(key)
    }
    
    const tagMap = new Map()
    
    taskList.forEach((task, index) => {
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
          // 每个标签都应该完整统计分配给它的任务金额
          const taskBudget = task.budget || 0
          const taskActualCost = task.actual_cost || 0
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
    
    
    // 计算每个标签的百分比
    groups.forEach(group => {
      const amount = mode === 'budget' ? group.budget : group.actualCost
      group.percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : '0'
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
  
  // 交互功能方法
  
  // 处理扇形点击事件
  const handleSegmentClick = (segmentId, debounceTime = 200) => {
    const now = Date.now()
    if (now - interactionState.lastClickTime < debounceTime) {
      return // 防抖处理
    }
    interactionState.lastClickTime = now
    
    // 如果点击的是已选中的扇形，切换回总览模式
    if (interactionState.selectedSegment === segmentId) {
      interactionState.selectedSegment = null
      interactionState.centerMode = 'total'
    } else {
      // 选中新的扇形
      interactionState.selectedSegment = segmentId
      interactionState.centerMode = 'category'
    }
    
    return {
      selectedSegment: interactionState.selectedSegment,
      centerMode: interactionState.centerMode
    }
  }
  
  // 设置悬停状态
  const setHoveredSegment = (segmentId) => {
    interactionState.hoveredSegment = segmentId
  }
  
  // 重置所有交互状态
  const resetInteractionState = () => {
    interactionState.selectedSegment = null
    interactionState.centerMode = 'total'
    interactionState.hoveredSegment = null
    interactionState.isAnimating = false
  }
  
  // 设置动画状态
  const setAnimating = (isAnimating) => {
    interactionState.isAnimating = isAnimating
  }
  
  // 获取当前选中的类别详情
  const getSelectedCategory = (tagGroups) => {
    if (!interactionState.selectedSegment || !tagGroups) {
      return null
    }
    return tagGroups.find(group => group.tagId === interactionState.selectedSegment)
  }
  
  // 判断扇形是否需要显示延伸标签（占比>5%）
  const shouldShowExtensionLabel = (percentage) => {
    return percentage > 5
  }
  
  // 转换数据格式为增强版格式
  const transformToEnhancedData = (tagGroups, mode = 'actual') => {
    if (!tagGroups || tagGroups.length === 0) return []
    
    return tagGroups.map(group => ({
      id: group.tagId,
      tagId: group.tagId,
      tagName: group.tagName,
      amount: mode === 'budget' ? group.budget : group.actualCost,
      count: group.taskCount,
      percentage: parseFloat(group.percentage || 0),
      color: group.tagColor,
      icon: getTagIcon(group.tagName),
      showExtensionLabel: shouldShowExtensionLabel(parseFloat(group.percentage || 0)),
      tasks: group.tasks
    }))
  }
  
  // 获取标签对应的图标
  const getTagIcon = (tagName) => {
    const iconMap = {
      '装修': 'home',
      '房租': 'house',
      '教育学习': 'book',
      '餐饮日常': 'cutlery',
      '汽车交通': 'car',
      '医疗健康': 'medical',
      '娱乐休闲': 'game',
      '购物消费': 'bag',
      '投资理财': 'money',
      '未分类': 'wallet'
    }
    return iconMap[tagName] || 'wallet'
  }
  
  // 计算增强版数据（同时包含交互状态）
  const calculateEnhancedExpenseData = (taskList) => {
    const baseData = calculateExpenseData(taskList)
    
    return {
      ...baseData,
      // 转换为增强版格式
      enhancedActualGroups: transformToEnhancedData(baseData.actualTagGroups, 'actual'),
      enhancedBudgetGroups: transformToEnhancedData(baseData.budgetTagGroups, 'budget'),
      // 交互状态
      interactionState: { ...interactionState },
      // 当前选中的类别
      selectedCategory: getSelectedCategory(baseData.actualTagGroups)
    }
  }

  return {
    tasks,
    totalBudget,
    totalExpense,
    calculateTotals,
    groupByTags,
    sortByAmount,
    calculateExpenseData,
    // 新增的交互功能
    interactionState,
    handleSegmentClick,
    setHoveredSegment,
    resetInteractionState,
    setAnimating,
    getSelectedCategory,
    shouldShowExtensionLabel,
    transformToEnhancedData,
    getTagIcon,
    calculateEnhancedExpenseData
  }
}