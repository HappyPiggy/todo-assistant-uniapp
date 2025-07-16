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
      <!-- 时序图区域 -->
      <view class="chart-section">
        <view class="section-header">
          <text class="section-title">任务完成时序图</text>
          <text class="section-subtitle">最近{{ timelineData.length }}个已完成任务</text>
        </view>
        <TaskTimelineChart 
          :timeline-data="timelineData"
          :loading="chartLoading"
        />
      </view>

      <!-- 统计概览 -->
      <view class="chart-section">
        <view class="section-header">
          <text class="section-title">统计概览</text>
        </view>
        <TaskStatsOverview 
          :stats-data="statsOverview"
          :book-data="bookData"
        />
      </view>

      <!-- 任务分布图表 -->
      <view class="chart-section">
        <view class="section-header">
          <text class="section-title">任务分布</text>
        </view>
        <TaskDistributionChart 
          :distribution-data="distributionData"
        />
      </view>

      <!-- 时间分析 -->
      <view class="chart-section">
        <view class="section-header">
          <text class="section-title">时间分析</text>
        </view>
        <TimeAnalysisChart 
          :time-data="timeAnalysisData"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

import LoadingState from '@/pages/todobooks/components/common/LoadingState.vue'
import ErrorState from '@/pages/todobooks/components/common/ErrorState.vue'
import TaskTimelineChart from '@/pages/todobooks/components/statistics/TaskTimelineChart.vue'
import TaskStatsOverview from '@/pages/todobooks/components/statistics/TaskStatsOverview.vue'
import TaskDistributionChart from '@/pages/todobooks/components/statistics/TaskDistributionChart.vue'
import TimeAnalysisChart from '@/pages/todobooks/components/statistics/TimeAnalysisChart.vue'

import { useBookData } from '@/pages/todobooks/composables/useBookData.js'

// 页面参数
let bookId = null

// 使用统计数据处理组合式函数
const {
  bookData,
  loading,
  error,
  chartLoading,
  timelineData,
  statsOverview,
  distributionData,
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