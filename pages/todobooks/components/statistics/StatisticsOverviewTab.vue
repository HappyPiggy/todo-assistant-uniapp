<template>
  <view class="statistics-overview-tab">
    <!-- 项目册信息卡片 -->
    <view class="info-card">
      <view class="card-header">
        <text class="card-title">项目概览</text>
      </view>
      <view class="card-content">
        <view class="stat-grid">
          <view class="stat-item">
            <text class="stat-value">{{ totalTasks }}</text>
            <text class="stat-label">总任务数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ completedTasks }}</text>
            <text class="stat-label">已完成</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ completionRate }}%</text>
            <text class="stat-label">完成率</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 任务完成时间线 -->
    <view class="timeline-section">
      <view class="section-header">
        <text class="section-title">完成时间线</text>
        <text class="section-subtitle">{{ timelineSubtitle }}</text>
      </view>
      
      <!-- 时间线组件 -->
      <TaskTimelineChart 
        v-if="timelineData && timelineData.length > 0"
        :timeline-data="timelineData"
        :loading="loading"
        :enable-virtual-scroll="enableVirtualScroll"
        @task-click="handleTaskClick"
      />
      
      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-text">暂无已完成的任务</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import TaskTimelineChart from './TaskTimelineChart.vue'

const props = defineProps({
  bookData: {
    type: Object,
    default: () => ({})
  },
  tasksData: {
    type: Array,
    default: () => []
  },
  statsData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 计算属性
const totalTasks = computed(() => {
  return props.statsData.totalTasks || props.tasksData.length || 0
})

const completedTasks = computed(() => {
  if (props.statsData.completedTasks !== undefined) {
    return props.statsData.completedTasks
  }
  return props.tasksData.filter(task => task.status === 'completed').length
})

const completionRate = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})

// 时间线数据
const timelineData = computed(() => {
  return props.tasksData
    .filter(task => task.status === 'completed' && task.completed_at)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .map((task, index) => ({
      ...task,
      index: index + 1,
      completedAt: task.completed_at
    }))
})

const timelineSubtitle = computed(() => {
  const count = timelineData.value.length
  return count > 0 ? `最近 ${count} 个已完成任务` : ''
})

// 是否启用虚拟滚动
const enableVirtualScroll = computed(() => {
  return timelineData.value.length > 100
})

// 处理任务点击
const handleTaskClick = (task) => {
  console.log('点击任务:', task.title)
  uni.navigateTo({
    url: `/pages/tasks/detail?id=${task._id || task.id}`
  })
}
</script>

<style lang="scss" scoped>
.statistics-overview-tab {
  padding: 16px;
  
  .info-card {
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
      .stat-grid {
        display: flex;
        justify-content: space-around;
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #007aff;
            margin-bottom: 4px;
          }
          
          .stat-label {
            font-size: 12px;
            color: #666;
          }
        }
      }
    }
  }
  
  .timeline-section {
    .section-header {
      margin-bottom: 16px;
      
      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
      
      .section-subtitle {
        font-size: 12px;
        color: #999;
        margin-left: 8px;
      }
    }
    
    .empty-state {
      padding: 40px;
      text-align: center;
      
      .empty-text {
        font-size: 14px;
        color: #999;
      }
    }
  }
}
</style>