<template>
  <view class="statistics-page">
    <!-- 页面标题区 -->
    <view class="page-header">
      <text class="page-title">{{ bookData.title || '项目册' }} - 数据统计</text>
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
              @task-click="handleTaskClick"
            />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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

// 页面状态管理
const isInitialized = ref(false) // 标记页面是否已初始化
const hasNavigatedAway = ref(false) // 标记是否曾经跳转到其他页面

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
    // 已移除震动反馈
    
    // 如果切换到消费统计，确保数据已加载
    if (tabKey === 'expense') {
      // 检查是否需要重新加载数据
      const needsDataLoad = !expenseData.value.totalBudget && !expenseData.value.totalActualCost
      const needsTagGroups = !tagGroups.value || tagGroups.value.length === 0
      
      if (needsDataLoad || needsTagGroups) {
        // 先设置loading状态，然后加载数据
        console.log('切换到消费统计Tab，正在加载数据...')
        loadExpenseData()
        
        // 使用nextTick确保数据更新后再切换tab
        nextTick(() => {
          activeTab.value = tabKey
          console.log('数据加载完成，切换到Tab:', tabKey)
        })
        return
      }
    }
    
    // 正常情况下直接切换
    activeTab.value = tabKey
    console.log('切换到Tab:', tabKey)
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
    const result = calculateExpenseData(allTasks.value)
    expenseResult.value = result // 存储完整结果
    expenseData.value = {
      totalBudget: result.totalBudget,
      totalActualCost: result.totalActualCost
    }
    // 默认显示实际支出的标签组
    tagGroups.value = result.actualTagGroups
  }
}

// 检查是否需要刷新数据
const checkShouldRefresh = () => {
  // 如果页面未初始化，需要刷新（首次加载或从菜单进入）
  if (!isInitialized.value) {
    console.log('统计页面：首次加载，需要刷新')
    return true
  }
  
  // 如果没有跳转过其他页面，说明是重新从菜单进入，需要刷新
  if (!hasNavigatedAway.value) {
    console.log('统计页面：从菜单重新进入，需要刷新')
    return true
  }
  
  console.log('统计页面：从其他页面返回，保持状态不刷新')
  // 重置跳转标记，为下次从菜单进入做准备
  hasNavigatedAway.value = false
  return false
}

// 处理视图切换（从ExpenseTab组件传上来的事件）
const handleExpenseViewChange = (viewMode) => {
  console.log('视图切换到:', viewMode)
  if (expenseResult.value) {
    tagGroups.value = viewMode === 'budget' ? expenseResult.value.budgetTagGroups : expenseResult.value.actualTagGroups
  }
}

// 处理任务点击跳转
const handleTaskClick = (task) => {
  console.log('统计页面 - 任务点击跳转:', task)
  
  try {
    // 参数验证
    if (!task) {
      console.error('任务跳转错误：task参数为空')
      uni.showToast({
        title: '任务信息缺失',
        icon: 'error'
      })
      return
    }
    
    if (!task._id) {
      console.error('任务跳转错误：缺少任务ID', task)
      uni.showToast({
        title: '任务信息异常',
        icon: 'error'
      })
      return
    }
    
    // 使用当前页面的bookId或从task中获取
    const taskBookId = task.todobook_id || bookId
    if (!taskBookId) {
      console.error('任务跳转错误：无法获取项目ID', { task, bookId })
      uni.showToast({
        title: '无法获取项目信息',
        icon: 'error'
      })
      return
    }
    
    // 构建跳转URL
    const url = `/pages/tasks/detail?id=${encodeURIComponent(task._id)}&todobook_id=${encodeURIComponent(taskBookId)}`
    console.log('任务跳转URL:', url)
    
    // 标记已经跳转到其他页面
    hasNavigatedAway.value = true
    console.log('标记已跳转到任务页面')
    
    uni.navigateTo({
      url: url,
      success: (res) => {
        console.log('任务页面跳转成功:', res)
      },
      fail: (err) => {
        console.error('导航失败:', err)
        
        // 根据错误类型提供不同的提示
        let errorMessage = '页面跳转失败'
        if (err.errMsg && err.errMsg.includes('navigate:fail page')) {
          errorMessage = '目标页面不存在'
        } else if (err.errMsg && err.errMsg.includes('navigate:fail url not in domain list')) {
          errorMessage = '页面路径配置异常'
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'error'
        })
      }
    })
    
  } catch (error) {
    console.error('任务跳转异常:', error)
    uni.showToast({
      title: '系统错误，请重试',
      icon: 'error'
    })
  }
}

// 页面生命周期
onLoad(async (options) => {
  console.log("统计页面 onLoad options", JSON.stringify(options, null, 2))
  if (options && options.id) {
    bookId = options.id
    
    // onLoad只在首次进入时调用，所以这里总是需要初始化
    
    await loadStatisticsData(bookId)
    // 加载完统计数据后，计算消费数据
    loadExpenseData()
    // 标记页面已初始化
    isInitialized.value = true
    console.log('统计页面初始化完成')
  } else {
    console.error('错误：未能从路由参数中获取到 id')
    uni.showToast({ title: '页面参数错误', icon: 'error' })
  }
})

onShow(async () => {
  // 页面显示时的处理逻辑
  if (bookId) {
    // 检查是否需要刷新数据
    // 只有在特定情况下才刷新：
    // 1. 数据为空（首次加载）
    // 2. 接收到数据更新事件标记
    const shouldRefresh = checkShouldRefresh()
    
    if (shouldRefresh) {
      console.log('统计页面onShow：需要刷新数据')
      await refreshStatistics(bookId)
      loadExpenseData()
    } else {
      console.log('统计页面onShow：保持当前状态，不刷新数据')
    }
  }
})

onMounted(() => {
  console.log('统计页面已挂载')
  
  // 监听重要的数据更新事件，这些情况下下次从菜单进入时需要刷新
  uni.$on('todobooks-updated', handleImportantDataUpdate)
  uni.$on('task-deleted', handleImportantDataUpdate)
  uni.$on('task-created', handleImportantDataUpdate)
})

// 页面卸载时清理事件监听
onUnmounted(() => {
  uni.$off('todobooks-updated', handleImportantDataUpdate)
  uni.$off('task-deleted', handleImportantDataUpdate)
  uni.$off('task-created', handleImportantDataUpdate)
})

// 处理重要数据更新事件（标记下次从菜单进入时需要刷新）
const handleImportantDataUpdate = (data) => {
  console.log('统计页面收到重要数据更新事件，下次从菜单进入时将刷新:', data)
  // 这里不立即刷新，只是为将来的菜单进入做准备
  // 可以在这里添加更精细的控制逻辑
}
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