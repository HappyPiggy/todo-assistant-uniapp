<template>
  <view class="statistics-expense-tab">
    <!-- 总预算和支出卡片 -->
    <view class="expense-summary-card">
      <view class="card-header">
        <text class="card-title">财务概览</text>
      </view>
      <view class="card-content">
        <view class="expense-grid">
          <view class="expense-item">
            <text class="expense-label">总预算</text>
            <text class="expense-value">¥{{ formatAmount(totalBudget) }}</text>
          </view>
          <view class="expense-item">
            <text class="expense-label">总支出</text>
            <text class="expense-value" :class="{ 'over-budget': isOverBudget }">
              ¥{{ formatAmount(totalExpense) }}
            </text>
            <text v-if="isOverBudget" class="warning-text">超支警告</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 视图切换按钮 -->
    <view class="view-switcher">
      <view class="switch-button" :class="{ active: viewMode === 'actual' }" @click="handleViewSwitch('actual')">
        <text class="button-text">实际支出</text>
      </view>
      <view class="switch-button" :class="{ active: viewMode === 'budget' }" @click="handleViewSwitch('budget')">
        <text class="button-text">预算分布</text>
      </view>
    </view>

    <!-- 增强版标签支出饼图（包含列表） -->
    <view v-if="hasTagData" class="chart-section">
      <view class="section-header">
        <text class="section-title">{{ viewMode === 'actual' ? '支出' : '预算' }}分布</text>
      </view>
      
      
      <EnhancedExpensePieChart 
        :expense-data="enhancedExpenseData"
        :width="chartSize"
        :height="chartSize"
        :view-mode="viewMode"
        @segment-click="handleSegmentClick"
        @chart-ready="handleChartReady"
        @task-click="handleTaskClick"
      />
    </view>

    <!-- 无标签提示 -->
    <view v-else class="empty-state">
      <text class="empty-text">暂无标签数据</text>
      <text class="empty-hint">请先为任务添加标签以查看分类统计</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, watch } from 'vue'
import EnhancedExpensePieChart from './EnhancedExpensePieChart.vue'

const props = defineProps({
  expenseData: {
    type: Object,
    default: () => ({})
  },
  tagGroups: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['view-change', 'task-click'])

// 视图模式：actual（实际支出）或 budget（预算）
const viewMode = ref('actual')

// 计算属性
const totalBudget = computed(() => props.expenseData.totalBudget || 0)
const totalExpense = computed(() => props.expenseData.totalActualCost || 0)
const isOverBudget = computed(() => totalExpense.value > totalBudget.value)
const hasTagData = computed(() => {
  const result = props.tagGroups && props.tagGroups.length > 0
  console.log('StatisticsExpenseTab - hasTagData:', result, 'tagGroups:', props.tagGroups)
  return result
})

// 排序后的标签组（按当前视图模式的金额从高到低）
const sortedTagGroups = computed(() => {
  if (!props.tagGroups) return []
  const field = viewMode.value === 'actual' ? 'actualCost' : 'budget'
  return [...props.tagGroups].sort((a, b) => (b[field] || 0) - (a[field] || 0))
})

// 增强版图表数据
const enhancedExpenseData = computed(() => {
  if (!sortedTagGroups.value || sortedTagGroups.value.length === 0) {
    return []
  }
  
  const result = sortedTagGroups.value.map(tag => ({
    id: tag.tagId || `tag_${Date.now()}_${Math.random()}`,
    tagId: tag.tagId,
    tagName: tag.tagName || '未分类',
    amount: tag[viewMode.value === 'actual' ? 'actualCost' : 'budget'] || 0,
    count: tag.taskCount || 0,
    color: tag.tagColor || '#999',
    tasks: tag.tasks || []
  }))
  
  return result
})

// 图表尺寸（响应式）
const chartSize = computed(() => {
  // 根据屏幕尺寸自适应，进一步增大图表尺寸
  try {
    const systemInfo = uni.getSystemInfoSync()
    const screenWidth = systemInfo.windowWidth
    
    // 根据不同屏幕尺寸设置不同的图表大小，再增大30-40px
    if (screenWidth <= 375) {
      return 320 // 小屏设备 (280 -> 320)
    } else if (screenWidth <= 414) {
      return 360 // 中等屏幕 (320 -> 360) 
    } else {
      return Math.min(screenWidth - 40, 400) // 大屏设备 (360 -> 400)
    }
  } catch (e) {
    return 360 // 默认尺寸 (320 -> 360)
  }
})

// 格式化金额
const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return '0.00'
  return Number(amount).toFixed(2)
}

// 切换视图
const handleViewSwitch = (mode) => {
  viewMode.value = mode
  emit('view-change', mode)
  
  // 保存用户偏好
  uni.setStorageSync('expense_view_mode', mode)
}

// 处理扇形点击事件
const handleSegmentClick = (segmentId, segmentData) => {
  console.log('统计页面：扇形被点击', { segmentId, segmentData })
  
  // 可以在这里添加额外的处理逻辑
  // 例如：跳转到任务详情、显示详细分析等
  // 已移除震动反馈
}

// 处理图表准备就绪事件
const handleChartReady = () => {
}

// 处理任务点击事件
const handleTaskClick = (task) => {
  console.log('StatisticsExpenseTab - 任务点击:', task)
  emit('task-click', task)
}

// 监听tagGroups数据变化，确保图表组件能及时响应
watch(() => props.tagGroups, (newTagGroups) => {
  console.log('StatisticsExpenseTab - tagGroups数据变化:', newTagGroups?.length || 0)
  // 数据变化时，可以在这里进行额外的处理
}, { deep: true })

// 恢复用户偏好
onMounted(() => {
  const savedMode = uni.getStorageSync('expense_view_mode')
  if (savedMode && ['actual', 'budget'].includes(savedMode)) {
    viewMode.value = savedMode
  }
  
  // 组件挂载后，主动触发一次视图切换事件
  // 确保父组件知道当前视图模式并加载对应数据
  console.log('StatisticsExpenseTab - 挂载完成，触发初始视图模式:', viewMode.value)
  emit('view-change', viewMode.value)
})
</script>

<style lang="scss" scoped>
.statistics-expense-tab {
  padding: 16px 30rpx;
  
  .expense-summary-card {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    
    .card-header {
      margin-bottom: 16px;
      
      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .card-content {
      .expense-grid {
        display: flex;
        justify-content: space-around;
        
        .expense-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          
          .expense-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
          }
          
          .expense-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            
            &.over-budget {
              color: #ff4444;
            }
          }
          
          .warning-text {
            font-size: 10px;
            color: #ff4444;
            margin-top: 4px;
          }
        }
      }
    }
  }
  
  .view-switcher {
    display: flex;
    background: #f5f5f5;
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 20px;
    
    .switch-button {
      flex: 1;
      padding: 8px 12px;
      text-align: center;
      border-radius: 6px;
      transition: all 0.3s;
      
      &.active {
        background: #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        
        .button-text {
          color: #007aff;
          font-weight: 600;
        }
      }
      
      .button-text {
        font-size: 14px;
        color: #666;
      }
    }
  }
  
  .chart-section {
    // 增强版组件包含自己的样式
    .section-header {
      margin-bottom: 12px;
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
  }
  
  .empty-state {
    padding: 60px 20px;
    text-align: center;
    
    .empty-text {
      font-size: 16px;
      color: #666;
      display: block;
      margin-bottom: 8px;
    }
    
    .empty-hint {
      font-size: 12px;
      color: #999;
      display: block;
    }
  }
}
</style>