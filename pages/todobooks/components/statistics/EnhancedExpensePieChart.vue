<template>
  <view class="enhanced-expense-pie-chart">
    <!-- 错误状态 -->
    <view v-if="error" class="error-state">
      <text class="error-icon">⚠️</text>
      <text class="error-text">{{ error }}</text>
      <view class="retry-button" @tap="handleRetry">
        <text>重试</text>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view v-else-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">图表加载中...</text>
    </view>
    
    <!-- 正常内容 -->
    <template v-else>
      <!-- 无数据状态 -->
      <view v-if="!enhancedChartData || enhancedChartData.length === 0" class="empty-state">
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无消费数据</text>
        <text class="empty-hint">请为任务添加标签和金额信息</text>
      </view>
      
      <!-- 有数据时的正常显示 -->
      <template v-else>
        <!-- 图表区域 -->
        <view class="chart-section">
          <!-- 图表容器，使用相对定位 -->
          <view class="chart-container">
            <!-- 跨平台饼图组件 -->
            <CrossPlatformPieChart 
              ref="canvasRef"
              :chart-data="enhancedChartData"
              :width="canvasWidth"
              :height="canvasHeight"
              :selected-segment="selectedSegment"
              :show-labels="showLabels"
              :enable-animation="true"
              :enable-interaction="true"
              @segment-click="handleSegmentClick"
              @canvas-ready="handleCanvasReady"
              @render-complete="handleRenderComplete"
              @error="handleChartError"
            />
            
            <!-- 中心显示组件 -->
            <PieChartCenter 
              :total-amount="totalAmount"
              :selected-category="selectedCategory"
              :center-mode="centerMode"
              :animation-duration="animationDuration"
            />
          </view>
        </view>
        
        <!-- 列表区域：始终显示标签列表 -->
        <view class="list-section">
          <ExpenseTagList
            :tag-data="enhancedChartData"
            :selected-segment="selectedSegment"
            :view-mode="viewMode"
            @item-click="handleTagItemClick"
            @task-click="handleTaskClick"
          />
        </view>
      </template>
    </template>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch, nextTick } from 'vue'
import CrossPlatformPieChart from '../charts/CrossPlatformPieChart.vue'
import PieChartCenter from './PieChartCenter.vue'
import ExpenseTagList from './ExpenseTagList.vue'

const props = defineProps({
  // 消费数据
  expenseData: {
    type: Array,
    default: () => []
  },
  // 图表尺寸
  width: {
    type: Number,
    default: 300
  },
  height: {
    type: Number,
    default: 300
  },
  // 是否显示延伸标签
  showLabels: {
    type: Boolean,
    default: true
  },
  // 动画时长
  animationDuration: {
    type: Number,
    default: 300
  },
  // 视图模式
  viewMode: {
    type: String,
    default: 'actual'
  }
})

const emit = defineEmits(['segment-click', 'chart-ready', 'task-click'])

// 组件引用
const canvasRef = ref(null)

// 响应式状态
const selectedSegment = ref(null)
const centerMode = ref('total') // 'total' | 'category'
const canvasReady = ref(false)

// 错误状态
const error = ref(null)
const loading = ref(true) // 默认为加载状态，等待数据

// Canvas 尺寸计算
const canvasWidth = computed(() => props.width)
const canvasHeight = computed(() => props.height)

// 计算增强版图表数据
const enhancedChartData = computed(() => {
  try {
    if (!props.expenseData || props.expenseData.length === 0) {
      return []
    }

    // 数据验证
    const validData = props.expenseData.filter(item => {
      const amount = item.amount || item.value || 0
      return typeof amount === 'number' && amount >= 0
    })

    if (validData.length === 0) {
      console.warn('无有效的消费数据')
      return []
    }

    const total = validData.reduce((sum, item) => sum + (item.amount || item.value || 0), 0)
    
    return validData.map((item, index) => {
      const amount = item.amount || item.value || 0
      const percentage = total > 0 ? (amount / total) * 100 : 0
      
      return {
        id: item.id || `category_${index}`,
        tagId: item.tagId || item.id,
        tagName: item.tagName || item.name || '未分类',
        amount: amount,
        count: Math.max(item.count || 1, 1), // 确保至少为1
        percentage: Math.round(percentage * 100) / 100,
        color: item.color || getDefaultColor(index),
        icon: item.icon || 'wallet',
        // 是否显示延伸标签（占比大于5%）
        showExtensionLabel: props.showLabels && percentage > 5,
        // 重要：传递tasks数组给ExpenseTagItem组件使用
        tasks: item.tasks || []
      }
    })
  } catch (err) {
    console.error('计算图表数据时出错:', err)
    error.value = '数据计算错误'
    return []
  }
})

// 计算总金额
const totalAmount = computed(() => {
  try {
    if (!props.expenseData || props.expenseData.length === 0) {
      return 0
    }
    
    return props.expenseData.reduce((sum, item) => {
      const amount = item.amount || item.value || 0
      return sum + (typeof amount === 'number' ? amount : 0)
    }, 0)
  } catch (err) {
    console.error('计算总金额时出错:', err)
    return 0
  }
})

// 当前选中的类别信息
const selectedCategory = computed(() => {
  if (!selectedSegment.value) return null
  return enhancedChartData.value.find(item => item.id === selectedSegment.value)
})

// 获取默认颜色
const getDefaultColor = (index) => {
  const colors = [
    '#007aff', '#34c759', '#ff9500', '#ff3b30', '#5856d6',
    '#af52de', '#ff2d55', '#5ac8fa', '#ffcc00', '#ff6b6b'
  ]
  return colors[index % colors.length]
}

// 处理扇形点击事件
const handleSegmentClick = (segmentData) => {
  try {
    if (!segmentData || !segmentData.id) {
      console.warn('无效的扇形数据')
      return
    }
    
    console.log('扇形被点击:', segmentData)
    
    // 执行选择逻辑
    toggleSegmentSelection(segmentData.id)
    
    // 发送事件给父组件
    emit('segment-click', segmentData.id, segmentData)
  } catch (err) {
    console.error('处理扇形点击时出错:', err)
  }
}

// 处理标签列表项点击事件
const handleTagItemClick = (itemData) => {
  console.log('标签列表项被点击:', itemData)
  
  // 执行选择逻辑
  toggleSegmentSelection(itemData.id)
  
  // 发送事件给父组件
  emit('segment-click', itemData.id, itemData)
}

// 处理任务点击事件
const handleTaskClick = (task) => {
  console.log('任务点击事件:', task)
  emit('task-click', task)
}

// 统一的选择切换逻辑
const toggleSegmentSelection = (segmentId) => {
  // 如果点击的是同一个扇形，切换回总览模式
  if (selectedSegment.value === segmentId) {
    selectedSegment.value = null
    centerMode.value = 'total'
  } else {
    // 切换到新选中的扇形
    selectedSegment.value = segmentId
    centerMode.value = 'category'
  }
  
  console.log('选择状态更新:', {
    selectedSegment: selectedSegment.value,
    centerMode: centerMode.value
  })
}

// 重试方法
const handleRetry = () => {
  try {
    loading.value = true
    error.value = null
    selectedSegment.value = null
    centerMode.value = 'total'
    
    // 重新初始化组件
    if (canvasRef.value && canvasRef.value.redraw) {
      canvasRef.value.redraw()
    }
    
  } catch (err) {
    console.error('重试失败:', err)
    error.value = '重试失败，请刷新页面'
    loading.value = false
  }
}

// Canvas 准备就绪处理
const handleCanvasReady = () => {
  try {
    canvasReady.value = true
    loading.value = false
    error.value = null
    emit('chart-ready')
  } catch (err) {
    console.error('Canvas准备就绪处理失败:', err)
    error.value = 'Canvas初始化失败'
    loading.value = false
  }
}

// 渲染完成处理
const handleRenderComplete = () => {
  console.log('跨平台饼图渲染完成')
  loading.value = false
}

// 图表错误处理
const handleChartError = (error) => {
  console.error('跨平台饼图错误:', error)
  error.value = '图表渲染失败'
  loading.value = false
}

// 监听数据变化，重置选中状态和管理加载状态
watch(() => props.expenseData, (newData, oldData) => {
  try {
    console.log('EnhancedExpensePieChart - 监听到数据变化:', {
      newData: newData?.length || 0,
      oldData: oldData?.length || 0
    })
    
    if (!newData || newData.length === 0) {
      // 数据为空时的处理
      selectedSegment.value = null
      centerMode.value = 'total'
      loading.value = true // 保持加载状态
      error.value = null
    } else {
      // 有数据时的处理
      selectedSegment.value = null
      centerMode.value = 'total'
      loading.value = false // 取消加载状态
      error.value = null
      
      // 延迟触发重绘，确保组件完全渲染
      setTimeout(() => {
        nextTick(() => {
          if (canvasRef.value && canvasRef.value.redraw) {
            console.log('延迟重绘：数据更新，触发Canvas重绘')
            canvasRef.value.redraw()
          }
        })
      }, 100) // 延迟100ms
      
      // 如果100ms后仍未成功，再次尝试
      setTimeout(() => {
        nextTick(() => {
          if (canvasRef.value && canvasRef.value.redraw) {
            console.log('二次重绘：确保图表显示')
            canvasRef.value.redraw()
          }
        })
      }, 300) // 延迟300ms
    }
  } catch (err) {
    console.error('数据变化监听出错:', err)
    error.value = '数据处理错误'
    loading.value = false
  }
}, { deep: true, immediate: true })

// 暴露给父组件的方法
defineExpose({
  // 重置选中状态
  resetSelection() {
    selectedSegment.value = null
    centerMode.value = 'total'
  },
  
  // 选择指定的扇形
  selectSegment(segmentId) {
    if (segmentId) {
      selectedSegment.value = segmentId
      centerMode.value = 'category'
    } else {
      selectedSegment.value = null
      centerMode.value = 'total'
    }
  },
  
  // 获取当前选中信息
  getSelectedInfo() {
    return {
      selectedSegment: selectedSegment.value,
      centerMode: centerMode.value,
      selectedCategory: selectedCategory.value
    }
  },
  
  // 强制重绘
  redraw() {
    if (canvasRef.value && canvasRef.value.redraw) {
      canvasRef.value.redraw()
    }
  },
  
  // 获取增强版数据
  getEnhancedData() {
    return enhancedChartData.value
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';
@import '../../styles/mixins.scss';
@import '../../styles/statistics.scss';

.enhanced-expense-pie-chart {
  position: relative;
  width: 100%;
  
  // 采用卡片布局方式
  @include stat-card;
  padding: 0;
  margin-bottom: $margin-base;
  
  // 图表区域
  .chart-section {
    padding: $padding-lg;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 350px;
  }
  
  // 图表容器
  .chart-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  // 列表区域
  .list-section {
    border-top: 1rpx solid $border-color-light;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 0 0 16px 16px;
  }
}

// 错误状态样式
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 200px;
  
  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .error-text {
    font-size: 14px;
    color: $error-color;
    text-align: center;
    margin-bottom: 20px;
  }
  
  .retry-button {
    padding: 8px 16px;
    background: $primary-color;
    color: white;
    border-radius: 6px;
    font-size: 14px;
    
    &:active {
      opacity: 0.8;
    }
  }
}

// 加载状态样式
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 200px;
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid $primary-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  .loading-text {
    font-size: 14px;
    color: $text-secondary;
  }
}

// 加载动画
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 空数据状态样式
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 200px;
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .empty-text {
    font-size: 16px;
    color: $text-secondary;
    text-align: center;
    margin-bottom: 8px;
  }
  
  .empty-hint {
    font-size: 12px;
    color: $text-tertiary;
    text-align: center;
  }
}

// 响应式适配
@media screen and (max-width: 750rpx) {
  .enhanced-expense-pie-chart {
    margin-bottom: $margin-sm;
    
    .chart-section {
      padding: $padding-base;
      min-height: 300px;
    }
  }
}

@media screen and (max-width: 480rpx) {
  .enhanced-expense-pie-chart {
    .chart-section {
      padding: $padding-sm;
      min-height: 260px;
    }
  }
  
  .error-state,
  .loading-state {
    padding: 40px 16px;
    min-height: 160px;
    
    .error-text,
    .loading-text {
      font-size: 12px;
    }
    
    .retry-button {
      padding: 6px 12px;
      font-size: 12px;
    }
  }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .enhanced-expense-pie-chart {
    background: rgba(42, 42, 46, 0.9);
    
    .list-section {
      background: rgba(42, 42, 46, 0.5);
      border-color: #3a3a3e;
    }
  }
}
</style>