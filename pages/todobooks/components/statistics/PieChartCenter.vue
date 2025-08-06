<template>
  <view class="pie-chart-center" :class="{ 'animating': isAnimating }">
    <transition name="center-fade" mode="out-in">
      <!-- 总支出模式 -->
      <view v-if="centerMode === 'total'" key="total" class="center-content">
        <text class="center-label">总支出</text>
        <text class="center-value">¥{{ animatedTotalAmount }}</text>
      </view>
      
      <!-- 单个类别模式 -->
      <view v-else-if="selectedCategory" key="category" class="center-content">
        <text class="center-label">{{ selectedCategory.tagName }}</text>
        <text class="center-value">¥{{ animatedCategoryAmount }}</text>
      </view>
    </transition>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, watch, onMounted, onBeforeUnmount } from 'vue'

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
const animatedTotalAmount = ref('')
const animatedCategoryAmount = ref('')

// 数字动画计数器
let animationFrame = null

// 格式化金额显示
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 数字动画函数
const animateNumber = (fromValue, toValue, duration, callback) => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
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
      animationFrame = requestAnimationFrame(animate)
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
  if (animate) {
    const currentAmount = parseFloat(animatedTotalAmount.value.replace(/[,¥]/g, '')) || 0
    animateNumber(currentAmount, newAmount, props.animationDuration, (value) => {
      animatedTotalAmount.value = value
    })
  } else {
    animatedTotalAmount.value = formatAmount(newAmount)
  }
}

// 更新类别金额显示
const updateCategoryAmount = (newAmount, animate = false) => {
  if (animate) {
    const currentAmount = parseFloat(animatedCategoryAmount.value.replace(/[,¥]/g, '')) || 0
    animateNumber(currentAmount, newAmount, props.animationDuration, (value) => {
      animatedCategoryAmount.value = value
    })
  } else {
    animatedCategoryAmount.value = formatAmount(newAmount)
  }
}

// 监听总金额变化
watch(() => props.totalAmount, (newAmount, oldAmount) => {
  console.log('中心显示: 总金额变化', { from: oldAmount, to: newAmount })
  if (props.centerMode === 'total') {
    updateTotalAmount(newAmount, oldAmount !== undefined)
  }
})

// 监听选中类别变化
watch(() => props.selectedCategory, (newCategory, oldCategory) => {
  console.log('中心显示: 选中类别变化', { 
    from: oldCategory?.tagName, 
    to: newCategory?.tagName,
    newCategoryData: newCategory,
    centerMode: props.centerMode
  })
  
  if (newCategory && props.centerMode === 'category') {
    updateCategoryAmount(newCategory.amount, oldCategory !== null)
  }
})

// 监听显示模式变化
watch(() => props.centerMode, (newMode, oldMode) => {
  console.log('中心显示: 模式变化', { from: oldMode, to: newMode })
  
  if (newMode === 'total') {
    updateTotalAmount(props.totalAmount, true)
  } else if (newMode === 'category' && props.selectedCategory) {
    updateCategoryAmount(props.selectedCategory.amount, true)
  }
})

// 组件挂载时初始化
onMounted(() => {
  console.log('PieChartCenter 挂载完成')
  
  // 初始化显示值
  if (props.centerMode === 'total') {
    updateTotalAmount(props.totalAmount, false)
  } else if (props.centerMode === 'category' && props.selectedCategory) {
    updateCategoryAmount(props.selectedCategory.amount, false)
  }
})

// 清理动画
onBeforeUnmount(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
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