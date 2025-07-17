<template>
  <view class="statistics-time-tab">
    <!-- 任务完成时序图 -->
    <view class="chart-section">
      <view class="section-header">
        <text class="section-title">任务完成时序图</text>
        <text class="section-subtitle">最近{{ timelineData.length }}个已完成任务</text>
      </view>
      <TaskTimelineChart 
        :timeline-data="timelineData"
        :loading="chartLoading"
        :container-height="getTimelineHeight()"
      />
    </view>

    <!-- 时间分析图表 -->
    <view class="chart-section">
      <view class="section-header">
        <text class="section-title">时间分析</text>
      </view>
      <TimeAnalysisChart 
        :time-data="timeAnalysisData"
      />
    </view>
  </view>
</template>

<script setup>
import { defineProps } from 'vue'
import TaskTimelineChart from './TaskTimelineChart.vue'
import TimeAnalysisChart from './TimeAnalysisChart.vue'

const props = defineProps({
  timelineData: {
    type: Array,
    required: true
  },
  timeAnalysisData: {
    type: Object,
    required: true
  },
  chartLoading: {
    type: Boolean,
    default: false
  }
})

// 动态计算时序图高度
const getTimelineHeight = () => {
  if (props.chartLoading) {
    return '200rpx' // 加载状态的最小高度
  }
  
  if (!props.timelineData || props.timelineData.length === 0) {
    return '200rpx' // 空状态的最小高度
  }
  
  // 根据数据量动态计算高度
  // 每个时序项大约占用 120rpx 高度，最小 300rpx，最大 600rpx
  const itemHeight = 120
  const minHeight = 300
  const maxHeight = 600
  const calculatedHeight = Math.min(maxHeight, Math.max(minHeight, props.timelineData.length * itemHeight))
  
  return `${calculatedHeight}rpx`
}
</script>

<style lang="scss" scoped>
.statistics-time-tab {
  .chart-section {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 16px;
    overflow: hidden;

    .section-header {
      padding: 16px 16px 8px;
      border-bottom: 1px solid #f0f0f0;

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        display: block;
        margin-bottom: 4px;
      }

      .section-subtitle {
        font-size: 12px;
        color: #666;
        display: block;
      }
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  // 确保内容在tab切换时有适当的间距
  :deep(.timeline-chart),
  :deep(.time-analysis-chart) {
    margin-top: 0;
  }
}
</style>