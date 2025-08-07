<template>
  <view class="pie-chart-center" :class="{ 'animating': isAnimating }">
    <!-- 总支出模式 -->
    <view v-if="centerMode === 'total'" class="center-content">
      <text class="center-label">总支出</text>
      <text class="center-value">{{ animatedTotalAmount }}</text>
    </view>
    
    <!-- 单个类别模式 -->
    <view v-else-if="centerMode === 'category'" class="center-content">
      <text class="center-label">{{ selectedCategory?.tagName || '未选择' }}</text>
      <text class="center-value">{{ animatedCategoryAmount }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  totalAmount: {
    type: Number,
    default: 0
  },
  selectedCategory: {
    type: Object,
    default: null
  },
  centerMode: {
    type: String,
    default: 'total' // 'total' | 'category'
  },
  animationDuration: {
    type: Number,
    default: 300
  }
})

// 动画状态
const isAnimating = ref(false)
const animatedTotalAmount = ref('0.00')
const animatedCategoryAmount = ref('0.00')

// 数字动画计数器
let animationFrame = null

// 兼容性处理：requestAnimationFrame polyfill
const getRequestAnimationFrame = () => {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame
  }
  // 降级处理：使用 setTimeout 模拟
  return (callback) => {
    return setTimeout(callback, 16) // 约60fps
  }
}

const getCancelAnimationFrame = () => {
  if (typeof cancelAnimationFrame !== 'undefined') {
    return cancelAnimationFrame
  }
  // 降级处理：使用 clearTimeout
  return (id) => {
    clearTimeout(id)
  }
}

// 格式化金额显示
const formatAmount = (amount) => {
  try {
    if (!amount && amount !== 0) return '0.00'
    
    // 确保输入是数字
    const num = Number(amount)
    if (isNaN(num)) return '0.00'
    
    // 先四舍五入到2位小数，避免浮点数精度问题
    const rounded = Math.round(num * 100) / 100
    
    return rounded.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  } catch (error) {
    return '0.00'
  }
}

// 数字动画函数
const animateNumber = (fromValue, toValue, duration, callback) => {
  const cancelFrame = getCancelAnimationFrame()
  const requestFrame = getRequestAnimationFrame()
  
  if (animationFrame) {
    cancelFrame(animationFrame)
  }
  
  isAnimating.value = true
  const startTime = Date.now()
  const startValue = parseFloat(fromValue) || 0
  const endValue = parseFloat(toValue) || 0
  const difference = endValue - startValue
  
  // 如果差值很小，直接设置最终值
  if (Math.abs(difference) < 0.01) {
    callback(formatAmount(endValue))
    isAnimating.value = false
    return
  }
  
  const animate = () => {
    const now = Date.now()
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用缓动函数（easeOutCubic）
    const easedProgress = 1 - Math.pow(1 - progress, 3)
    const currentValue = startValue + (difference * easedProgress)
    
    callback(formatAmount(currentValue))
    
    if (progress < 1) {
      animationFrame = requestFrame(animate)
    } else {
      // 确保最终值精确
      callback(formatAmount(endValue))
      isAnimating.value = false
    }
  }
  
  animate()
}

// 更新总金额显示
const updateTotalAmount = (newAmount, animate = false) => {
  try {
    const safeAmount = Number(newAmount) || 0
    if (animate) {
      const currentAmount = parseFloat((animatedTotalAmount.value || '0').toString().replace(/[,]/g, '')) || 0
      animateNumber(currentAmount, safeAmount, props.animationDuration, (value) => {
        animatedTotalAmount.value = value
      })
    } else {
      animatedTotalAmount.value = formatAmount(safeAmount)
    }
  } catch (error) {
    console.error('更新总金额显示出错:', error)
    animatedTotalAmount.value = formatAmount(0)
  }
}

// 更新类别金额显示
const updateCategoryAmount = (newAmount, animate = false) => {
  try {
    const safeAmount = Number(newAmount) || 0
    
    if (animate) {
      const currentAmount = parseFloat((animatedCategoryAmount.value || '0').toString().replace(/[,]/g, '')) || 0
      animateNumber(currentAmount, safeAmount, props.animationDuration, (value) => {
        animatedCategoryAmount.value = value
      })
    } else {
      animatedCategoryAmount.value = formatAmount(safeAmount)
    }
  } catch (error) {
    console.error('更新类别金额显示出错:', error)
    animatedCategoryAmount.value = formatAmount(0)
  }
}

// 监听总金额变化
watch(() => props.totalAmount, (newAmount, oldAmount) => {
  try {
    if (props.centerMode === 'total') {
      updateTotalAmount(newAmount, oldAmount !== undefined)
    }
  } catch (error) {
    console.error('监听总金额变化出错:', error)
  }
})

// 监听选中类别变化
watch(() => props.selectedCategory, (newCategory, oldCategory) => {
  try {
    // 确保在 category 模式下正确更新显示
    if (props.centerMode === 'category') {
      if (newCategory && typeof newCategory.amount !== 'undefined') {
        updateCategoryAmount(newCategory.amount, oldCategory !== null)
      } else {
        // 如果类别被清空但仍在 category 模式，显示0
        updateCategoryAmount(0, true)
      }
    }
  } catch (error) {
    console.error('监听选中类别变化出错:', error)
    // 发生错误时显示0
    if (props.centerMode === 'category') {
      updateCategoryAmount(0, false)
    }
  }
}, { deep: true })

// 监听显示模式变化
watch(() => props.centerMode, (newMode, oldMode) => {
  try {
    if (newMode === 'total') {
      updateTotalAmount(props.totalAmount, oldMode !== undefined)
    } else if (newMode === 'category') {
      if (props.selectedCategory && typeof props.selectedCategory.amount !== 'undefined') {
        updateCategoryAmount(props.selectedCategory.amount, oldMode !== undefined)
      } else {
        // 如果没有选中类别但切换到 category 模式，显示0
        updateCategoryAmount(0, oldMode !== undefined)
      }
    }
  } catch (error) {
    console.error('监听显示模式变化出错:', error)
    // 发生错误时回退到默认显示
    updateTotalAmount(props.totalAmount || 0, false)
  }
})

// 组件挂载时初始化
onMounted(() => {
  // 初始化显示值
  if (props.centerMode === 'total') {
    updateTotalAmount(props.totalAmount, false)
  } else if (props.centerMode === 'category') {
    if (props.selectedCategory) {
      updateCategoryAmount(props.selectedCategory.amount, false)
    } else {
      // 如果在 category 模式但没有选中类别，显示0
      updateCategoryAmount(0, false)
    }
  }
  
  // 如果没有设置任何模式，默认显示总金额
  if (!props.centerMode || (props.centerMode !== 'total' && props.centerMode !== 'category')) {
    updateTotalAmount(props.totalAmount, false)
  }
})

// 清理动画
onBeforeUnmount(() => {
  if (animationFrame) {
    const cancelFrame = getCancelAnimationFrame()
    cancelFrame(animationFrame)
  }
})
</script>

<style lang="scss" scoped>
.pie-chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  z-index: 10;
  
  .center-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80px;
  }
  
  .center-label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .center-value {
    display: block;
    font-size: 18px;
    font-weight: bold;
    color: #333;
    line-height: 1.2;
    margin-bottom: 2px;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
  
  .center-count {
    display: block;
    font-size: 10px;
    color: #666;
    font-weight: normal;
  }
  
  &.animating {
    .center-value {
      transition: all 0.1s ease;
    }
  }
}

// 过渡动画
.center-fade-enter-active,
.center-fade-leave-active {
  transition: all 0.25s ease;
}

.center-fade-enter-from,
.center-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.center-fade-enter-to,
.center-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

// 响应式适配
@media (max-width: 480px) {
  .pie-chart-center {
    .center-value {
      font-size: 18px;
    }
    
    .center-label {
      font-size: 11px;
    }
    
    .center-count {
      font-size: 9px;
    }
  }
}
</style>