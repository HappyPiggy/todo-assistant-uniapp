import { ref, computed, nextTick } from 'vue'

/**
 * 简化版虚拟滚动组合函数
 * @param {Array|Ref} items - 数据列表或响应式引用
 * @param {Object} options - 配置选项
 * @returns {Object} 虚拟滚动相关状态和方法
 */
export function useVirtualList(items, options = {}) {
  const {
    containerHeight = 600,
    estimatedItemHeight = 90, // 默认预估高度调整为90
    overscan = 3, // 预渲染数量，上下各3个作为缓冲
    fixedHeaderHeight = ref(0) // 固定头部高度
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
   * 获取有效的容器高度
   */
  const effectiveContainerHeight = computed(() => {
    const height = typeof containerHeight === 'function' ? containerHeight() : 
                   (containerHeight.value || containerHeight)
    return height
  })

  /**
   * 获取固定头部高度值
   */
  const headerHeight = computed(() => {
    return typeof fixedHeaderHeight === 'function' ? fixedHeaderHeight() :
           (fixedHeaderHeight.value || fixedHeaderHeight || 0)
  })

  /**
   * 计算可见范围
   */
  const visibleRange = computed(() => {
    if (itemList.value.length === 0) {
      return { start: 0, end: 0, renderStart: 0, renderEnd: 0 }
    }

    // 暂时简化计算，直接使用滚动位置
    const adjustedScrollTop = Math.max(0, scrollTop.value)
    
    // 计算可视区域的起始和结束索引（更保守的计算）
    const viewStart = Math.max(0, Math.floor(adjustedScrollTop / estimatedItemHeight))
    const baseVisibleCount = Math.ceil(effectiveContainerHeight.value / estimatedItemHeight)
    const viewEnd = Math.min(itemList.value.length, viewStart + baseVisibleCount + 2) // +2 确保更多边界元素被渲染
    
    // 计算渲染范围（更大的缓冲区）
    const renderStart = Math.max(0, viewStart - overscan)
    const renderEnd = Math.min(itemList.value.length, viewEnd + overscan + 2) // 额外缓冲


    return { 
      start: viewStart,
      end: viewEnd,
      renderStart,
      renderEnd
    }
  })

  /**
   * 可见的任务列表
   */
  const visibleTasks = computed(() => {
    const { renderStart, renderEnd } = visibleRange.value
    return itemList.value.slice(renderStart, renderEnd)
  })

  /**
   * 上方偏移量（占位高度）
   */
  const offsetTop = computed(() => {
    const { renderStart } = visibleRange.value
    return renderStart * estimatedItemHeight
  })

  /**
   * 下方偏移量（占位高度）
   */
  const offsetBottom = computed(() => {
    const { renderEnd } = visibleRange.value
    const remaining = itemList.value.length - renderEnd
    // 避免负数高度
    return Math.max(0, remaining * estimatedItemHeight)
  })

  /**
   * 处理滚动事件
   */
  const handleScroll = (event) => {
    const { scrollTop: newScrollTop } = event.detail
    
    // 避免不必要的更新
    if (Math.abs(scrollTop.value - newScrollTop) < 1) {
      return
    }
    
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
    scrollTop.value = index * estimatedItemHeight + headerHeight.value
  }

  /**
   * 滚动到顶部（直接跳转，无动画）
   */
  const scrollToTop = () => {
    // 直接设置为0，无动画效果
    scrollTop.value = 0
    // 立即返回，不等待动画
    return Promise.resolve()
  }

  /**
   * 滚动到底部
   */
  const scrollToBottom = () => {
    // 确保滚动到最后一个元素可见
    const maxScrollTop = Math.max(0, totalHeight.value + headerHeight.value - effectiveContainerHeight.value)
    scrollTop.value = maxScrollTop
  }

  /**
   * 获取调试信息
   */
  const getDebugInfo = () => {
    const range = visibleRange.value
    return {
      totalItems: itemList.value.length,
      viewRange: { start: range.start, end: range.end },
      renderRange: { start: range.renderStart, end: range.renderEnd },
      renderedTasks: visibleTasks.value.length,
      scrollTop: scrollTop.value,
      totalHeight: totalHeight.value,
      offsetTop: offsetTop.value,
      offsetBottom: offsetBottom.value,
      isScrolling: isScrolling.value,
      effectiveContainerHeight: effectiveContainerHeight.value,
      headerHeight: headerHeight.value,
      estimatedItemHeight,
      overscan
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