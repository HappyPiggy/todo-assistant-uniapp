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
const currentTranslateX = ref(0)
const isTransitioning = ref(false)
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

// 内容包装器样式
const contentWrapperStyle = computed(() => {
  const currentIndex = tabs.indexOf(activeTab.value)
  // 每个tab占50%wrapper宽度，所以移动距离是 currentIndex * 50%
  const translateX = -currentIndex * 50 + currentTranslateX.value
  
  return {
    transform: `translateX(${translateX}%)`,
    transition: isTransitioning.value ? 'transform 0.3s ease-out' : 'none'
  }
})

// Tab切换处理
const handleTabChange = (tabKey) => {
  if (tabKey !== activeTab.value) {
    activeTab.value = tabKey
    currentTranslateX.value = 0
    isTransitioning.value = true
    
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
    
    console.log('切换到Tab:', tabKey)
  }
}

// 滑动处理函数
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isTransitioning.value = false
  isSwipeStarted.value = false
  currentTranslateX.value = 0
}

const handleTouchMove = (e) => {
  if (isTransitioning.value) return
  
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
    
    // 计算滑动距离（限制在合理范围内）
    const maxTranslate = 25 // 最大滑动距离百分比
    const screenWidth = uni.getSystemInfoSync().screenWidth
    const translatePercent = (deltaX / screenWidth) * 100
    currentTranslateX.value = Math.max(-maxTranslate, Math.min(maxTranslate, translatePercent))
  }
}

const handleTouchEnd = () => {
  if (isTransitioning.value) return
  
  // 只有在实际进行了滑动时才判断切换
  if (!isSwipeStarted.value) {
    return
  }
  
  // 基于实际滑动距离的阈值（像素）
  const screenWidth = uni.getSystemInfoSync().screenWidth
  const minSwipeDistance = screenWidth * 0.15 // 需要滑动屏幕宽度的15%
  const actualSwipeDistance = (currentTranslateX.value / 100) * screenWidth
  
  const currentIndex = tabs.indexOf(activeTab.value)
  
  if (actualSwipeDistance > minSwipeDistance && currentIndex > 0) {
    // 向右滑动，切换到上一个tab
    handleTabChange(tabs[currentIndex - 1])
  } else if (actualSwipeDistance < -minSwipeDistance && currentIndex < tabs.length - 1) {
    // 向左滑动，切换到下一个tab
    handleTabChange(tabs[currentIndex + 1])
  } else {
    // 未达到切换阈值，恢复原位
    currentTranslateX.value = 0
    isTransitioning.value = true
    
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
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