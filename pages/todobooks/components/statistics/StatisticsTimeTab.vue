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