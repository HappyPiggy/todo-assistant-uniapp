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

    <!-- 标签支出饼图 -->
    <view v-if="hasTagData" class="chart-section">
      <view class="section-header">
        <text class="section-title">{{ viewMode === 'actual' ? '支出' : '预算' }}分布</text>
      </view>
      <ExpensePieChart 
        :chart-data="currentChartData"
        :view-mode="viewMode"
      />
    </view>

    <!-- 标签详细列表 -->
    <view v-if="hasTagData" class="tag-list-section">
      <view class="section-header">
        <text class="section-title">标签明细</text>
      </view>
      <view class="tag-list">
        <view v-for="(tag, index) in sortedTagGroups" :key="tag.tagId || index" class="tag-item">
          <view class="tag-header">
            <view class="tag-name-wrapper">
              <view class="tag-color" :style="{ backgroundColor: tag.tagColor || '#999' }"></view>
              <text class="tag-name">{{ tag.tagName || '未分类' }}</text>
            </view>
            <text class="tag-percentage">{{ tag.percentage }}%</text>
          </view>
          <view class="tag-details">
            <text class="tag-amount">¥{{ formatAmount(tag[viewMode === 'actual' ? 'actualCost' : 'budget']) }}</text>
            <text class="tag-count">{{ tag.taskCount }}个任务</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 无标签提示 -->
    <view v-else class="empty-state">
      <text class="empty-text">暂无标签数据</text>
      <text class="empty-hint">请先为任务添加标签以查看分类统计</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted } from 'vue'
import ExpensePieChart from './ExpensePieChart.vue'

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

const emit = defineEmits(['view-change'])

// 视图模式：actual（实际支出）或 budget（预算）
const viewMode = ref('actual')

// 计算属性
const totalBudget = computed(() => props.expenseData.totalBudget || 0)
const totalExpense = computed(() => props.expenseData.totalActualCost || 0)
const isOverBudget = computed(() => totalExpense.value > totalBudget.value)
const hasTagData = computed(() => props.tagGroups && props.tagGroups.length > 0)

// 排序后的标签组（按当前视图模式的金额从高到低）
const sortedTagGroups = computed(() => {
  if (!props.tagGroups) return []
  const field = viewMode.value === 'actual' ? 'actualCost' : 'budget'
  return [...props.tagGroups].sort((a, b) => (b[field] || 0) - (a[field] || 0))
})

// 当前图表数据
const currentChartData = computed(() => {
  return sortedTagGroups.value.map(tag => ({
    name: tag.tagName || '未分类',
    value: tag[viewMode.value === 'actual' ? 'actualCost' : 'budget'] || 0,
    color: tag.tagColor || '#999',
    percentage: tag.percentage || 0
  }))
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

// 恢复用户偏好
onMounted(() => {
  const savedMode = uni.getStorageSync('expense_view_mode')
  if (savedMode && ['actual', 'budget'].includes(savedMode)) {
    viewMode.value = savedMode
  }
})
</script>

<style lang="scss" scoped>
.statistics-expense-tab {
  padding: 16px;
  
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
            font-size: 24px;
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
    margin-bottom: 20px;
    
    .section-header {
      margin-bottom: 12px;
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
  }
  
  .tag-list-section {
    .section-header {
      margin-bottom: 12px;
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .tag-list {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      
      .tag-item {
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .tag-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          
          .tag-name-wrapper {
            display: flex;
            align-items: center;
            
            .tag-color {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              margin-right: 8px;
            }
            
            .tag-name {
              font-size: 14px;
              font-weight: 500;
              color: #333;
            }
          }
          
          .tag-percentage {
            font-size: 14px;
            font-weight: 600;
            color: #007aff;
          }
        }
        
        .tag-details {
          display: flex;
          justify-content: space-between;
          padding-left: 20px;
          
          .tag-amount {
            font-size: 12px;
            color: #666;
          }
          
          .tag-count {
            font-size: 12px;
            color: #999;
          }
        }
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