<template>
  <view class="statistics-page">
    <!-- 页面标题区 -->
    <view class="page-header">
      <text class="page-title">{{ bookData.title || '项目册' }} - 数据统计</text>
      <text class="page-subtitle">{{ `共${totalTasks}个任务，${completedTasks}个已完成` }}</text>
    </view>

    <!-- 加载状态 -->
    <LoadingState v-if="loading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-if="error" 
      :message="error"
      @retry="loadStatisticsData" />

    <!-- 统计内容 -->
    <view v-if="!loading && !error" class="statistics-content">
      <!-- Tab栏 -->
      <StatisticsTabBar 
        :active-tab="activeTab"
        @tab-change="handleTabChange"
      />

      <!-- Tab内容区 -->
      <view 
        class="tab-content"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <view 
          class="tab-content-wrapper"
          :style="contentWrapperStyle"
        >
          <!-- 总览统计 -->
          <view class="tab-panel" :class="{ 'active': activeTab === 'overview' }">
            <StatisticsOverviewTab 
              :book-data="bookData"
              :tasks-data="allTasks"
              :stats-data="statsOverview"
              :loading="chartLoading"
            />
          </view>

          <!-- 消费统计 -->
          <view class="tab-panel" :class="{ 'active': activeTab === 'expense' }">
            <StatisticsExpenseTab 
              :expense-data="expenseData"
              :tag-groups="tagGroups"
              @view-change="handleExpenseViewChange"
            />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

import LoadingState from '@/pages/todobooks/components/common/LoadingState.vue'
import ErrorState from '@/pages/todobooks/components/common/ErrorState.vue'
import StatisticsTabBar from '@/pages/todobooks/components/statistics/StatisticsTabBar.vue'
import StatisticsOverviewTab from '@/pages/todobooks/components/statistics/StatisticsOverviewTab.vue'
import StatisticsExpenseTab from '@/pages/todobooks/components/statistics/StatisticsExpenseTab.vue'

import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { useExpenseData } from '@/pages/todobooks/composables/useExpenseData.js'

// 页面参数
let bookId = null

// Tab状态管理
const activeTab = ref('overview')
const tabs = ['overview', 'expense']

// 滑动状态管理
const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwipeStarted = ref(false)

// 使用统计数据处理组合式函数
const {
  bookData,
  loading,
  error,
  allTasks,
  chartLoading,
  timelineData,
  statsOverview,
  timeAnalysisData,
  loadStatisticsData,
  refreshStatistics,
  getCompletedTasksTimeline
} = useBookData()

// 使用消费数据处理组合式函数
const {
  calculateExpenseData
} = useExpenseData()

// 消费统计数据
const expenseData = ref({})
const tagGroups = ref([])
const expenseResult = ref(null) // 存储完整的消费统计结果

// 计算属性
const totalTasks = computed(() => {
  return statsOverview.value.total || 0
})

const completedTasks = computed(() => {
  return statsOverview.value.completed || 0
})

// 内容包装器样式（简化，因为现在使用display切换）
const contentWrapperStyle = computed(() => {
  return {
    // 不再需要transform动画，使用CSS的display切换
  }
})

// Tab切换处理
const handleTabChange = (tabKey) => {
  if (tabKey !== activeTab.value) {
    // 添加震动反馈（如果设备支持）
    if (uni.vibrateShort) {
      uni.vibrateShort({
        type: 'light'
      })
    }
    
    activeTab.value = tabKey
    console.log('切换到Tab:', tabKey)
    
    // 如果切换到消费统计，确保数据已加载并等待数据准备
    if (tabKey === 'expense') {
      if (!expenseData.value.totalBudget && !expenseData.value.totalActualCost) {
        loadExpenseData()
      }
      // 确保标签组数据也已准备好
      if (expenseResult.value && (!tagGroups.value || tagGroups.value.length === 0)) {
        const defaultView = 'actual' // 默认显示实际支出
        tagGroups.value = expenseResult.value.actualTagGroups
      }
    }
  }
}

// 简化的滑动处理函数
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isSwipeStarted.value = false
}

const handleTouchMove = (e) => {
  const touchCurrentX = e.touches[0].clientX
  const touchCurrentY = e.touches[0].clientY
  const deltaX = touchCurrentX - touchStartX.value
  const deltaY = touchCurrentY - touchStartY.value
  
  // 首次判断滑动方向
  if (!isSwipeStarted.value && (Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15)) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      isSwipeStarted.value = true
      e.preventDefault()
    } else {
      // 垂直滑动，不处理
      return
    }
  }
  
  // 只处理已确定的水平滑动
  if (isSwipeStarted.value) {
    e.preventDefault()
  }
}

const handleTouchEnd = (e) => {
  // 只有在实际进行了滑动时才判断切换
  if (!isSwipeStarted.value) {
    return
  }
  
  const touchCurrentX = e.changedTouches[0].clientX
  const deltaX = touchCurrentX - touchStartX.value
  
  // 基于滑动距离的阈值
  const minSwipeDistance = 50 // 最小滑动距离（像素）
  const currentIndex = tabs.indexOf(activeTab.value)
  
  if (deltaX > minSwipeDistance && currentIndex > 0) {
    // 向右滑动，切换到上一个tab
    handleTabChange(tabs[currentIndex - 1])
  } else if (deltaX < -minSwipeDistance && currentIndex < tabs.length - 1) {
    // 向左滑动，切换到下一个tab
    handleTabChange(tabs[currentIndex + 1])
  }
  
  // 重置滑动状态
  isSwipeStarted.value = false
}

// 加载并计算消费数据
const loadExpenseData = () => {
  if (allTasks.value && allTasks.value.length > 0) {
    console.log('=== 开始计算消费数据 ===')
    console.log('任务数据:', JSON.stringify(allTasks.value.slice(0, 2), null, 2)) // 只显示前两个任务的详细信息
    
    const result = calculateExpenseData(allTasks.value)
    expenseResult.value = result // 存储完整结果
    expenseData.value = {
      totalBudget: result.totalBudget,
      totalActualCost: result.totalActualCost
    }
    // 默认显示实际支出的标签组
    tagGroups.value = result.actualTagGroups
    
    console.log('消费数据计算完成:', {
      totalBudget: result.totalBudget,
      totalActualCost: result.totalActualCost,
      actualTagGroups: result.actualTagGroups.length,
      budgetTagGroups: result.budgetTagGroups.length
    })
  }
}

// 处理视图切换（从ExpenseTab组件传上来的事件）
const handleExpenseViewChange = (viewMode) => {
  console.log('视图切换到:', viewMode)
  if (expenseResult.value) {
    tagGroups.value = viewMode === 'budget' ? expenseResult.value.budgetTagGroups : expenseResult.value.actualTagGroups
    console.log('更新标签组数据:', tagGroups.value.length)
  }
}

// 页面生命周期
onLoad(async (options) => {
  console.log("统计页面 onLoad options", JSON.stringify(options, null, 2))
  if (options && options.id) {
    bookId = options.id
    await loadStatisticsData(bookId)
    // 加载完统计数据后，计算消费数据
    loadExpenseData()
  } else {
    console.error('错误：未能从路由参数中获取到 id')
    uni.showToast({ title: '页面参数错误', icon: 'error' })
  }
})

onShow(async () => {
  // 页面显示时刷新数据
  if (bookId) {
    await refreshStatistics(bookId)
    loadExpenseData()
  }
})

onMounted(() => {
  console.log('统计页面已挂载')
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/statistics.scss';

// Tab内容切换动画
.tab-panel {
  &:not(.active) {
    display: none;
    opacity: 0;
  }
  
  &.active {
    display: block;
    animation: fadeInUp 0.3s ease-in-out;
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 滑动切换时的过渡效果
.tab-content {
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}
</style>