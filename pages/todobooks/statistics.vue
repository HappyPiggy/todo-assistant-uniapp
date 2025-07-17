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
              :stats-data="statsOverview"
              :book-data="bookData"
            />
          </view>

          <!-- 时间分析 -->
          <view class="tab-panel" :class="{ 'active': activeTab === 'time' }">
            <StatisticsTimeTab 
              :timeline-data="timelineData"
              :time-analysis-data="timeAnalysisData"
              :chart-loading="chartLoading"
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
import StatisticsTimeTab from '@/pages/todobooks/components/statistics/StatisticsTimeTab.vue'

import { useBookData } from '@/pages/todobooks/composables/useBookData.js'

// 页面参数
let bookId = null

// Tab状态管理
const activeTab = ref('overview')
const tabs = ['overview', 'time']

// 滑动状态管理
const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwipeStarted = ref(false)

// 使用统计数据处理组合式函数
const {
  bookData,
  loading,
  error,
  chartLoading,
  timelineData,
  statsOverview,
  timeAnalysisData,
  loadStatisticsData,
  refreshStatistics
} = useBookData()

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

// 页面生命周期
onLoad((options) => {
  console.log("统计页面 onLoad options", JSON.stringify(options, null, 2))
  if (options && options.id) {
    bookId = options.id
    loadStatisticsData(bookId)
  } else {
    console.error('错误：未能从路由参数中获取到 id')
    uni.showToast({ title: '页面参数错误', icon: 'error' })
  }
})

onShow(() => {
  // 页面显示时刷新数据
  if (bookId) {
    refreshStatistics(bookId)
  }
})

onMounted(() => {
  console.log('统计页面已挂载')
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/statistics.scss';
</style>