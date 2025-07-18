import { ref, computed } from 'vue'

/**
 * 简化版虚拟滚动组合函数
 * @param {Array|Ref} items - 数据列表或响应式引用
 * @param {Object} options - 配置选项
 * @returns {Object} 虚拟滚动相关状态和方法
 */
export function useVirtualList(items, options = {}) {
  const {
    containerHeight = 600,
    estimatedItemHeight = 120,
    overscan = 3 // 预渲染数量
  } = options

  // 滚动状态
  const scrollTop = ref(0)
  const isScrolling = ref(false)
  
  // 滚动计时器
  let scrollTimer = null

  // 确保 items 是响应式的
  const itemList = computed(() => {
    // 如果 items 是响应式引用，返回其值；否则直接返回数组
    return Array.isArray(items) ? items : (items.value || [])
  })

  /**
   * 计算总高度
   */
  const totalHeight = computed(() => {
    return itemList.value.length * estimatedItemHeight
  })

  /**
   * 计算可见范围
   */
  const visibleRange = computed(() => {
    if (itemList.value.length === 0) {
      return { start: 0, end: 0 }
    }

    // 计算起始索引
    const start = Math.floor(scrollTop.value / estimatedItemHeight)
    // 计算可见数量
    const visibleCount = Math.ceil(containerHeight / estimatedItemHeight)
    // 计算结束索引
    const end = Math.min(itemList.value.length, start + visibleCount + overscan)

    return { 
      start: Math.max(0, start - overscan), 
      end 
    }
  })

  /**
   * 可见的任务列表
   */
  const visibleTasks = computed(() => {
    const { start, end } = visibleRange.value
    return itemList.value.slice(start, end)
  })

  /**
   * 上方偏移量（占位高度）
   */
  const offsetTop = computed(() => {
    const { start } = visibleRange.value
    return start * estimatedItemHeight
  })

  /**
   * 下方偏移量（占位高度）
   */
  const offsetBottom = computed(() => {
    const { end } = visibleRange.value
    return (itemList.value.length - end) * estimatedItemHeight
  })

  /**
   * 处理滚动事件
   */
  const handleScroll = (event) => {
    const { scrollTop: newScrollTop } = event.detail
    scrollTop.value = newScrollTop
    
    isScrolling.value = true
    
    // 清除之前的计时器
    if (scrollTimer) {
      clearTimeout(scrollTimer)
    }
    
    // 设置新的计时器，在滚动停止后重置状态
    scrollTimer = setTimeout(() => {
      isScrolling.value = false
    }, 150)
  }

  /**
   * 更新项目高度（简化版本，不实际使用）
   */
  const updateItemHeight = (itemId, height) => {
    // 简化版本不需要动态高度
  }

  /**
   * 滚动到指定索引
   */
  const scrollToIndex = (index) => {
    if (index < 0 || index >= itemList.value.length) return
    scrollTop.value = index * estimatedItemHeight
  }

  /**
   * 滚动到顶部
   */
  const scrollToTop = () => {
    scrollTop.value = 0
  }

  /**
   * 滚动到底部
   */
  const scrollToBottom = () => {
    scrollTop.value = totalHeight.value
  }

  /**
   * 获取调试信息
   */
  const getDebugInfo = () => {
    return {
      totalItems: itemList.value.length,
      visibleRange: visibleRange.value,
      scrollTop: scrollTop.value,
      totalHeight: totalHeight.value,
      offsetTop: offsetTop.value,
      offsetBottom: offsetBottom.value,
      isScrolling: isScrolling.value
    }
  }

  return {
    // 状态
    scrollTop,
    isScrolling,
    totalHeight,
    visibleTasks,
    offsetTop,
    offsetBottom,
    visibleRange,
    
    // 方法
    handleScroll,
    updateItemHeight,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    getDebugInfo
  }
}