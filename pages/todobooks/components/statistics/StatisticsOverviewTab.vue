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
        
        <!-- 新增的项目信息行 -->
        <view class="book-info-row">
          <view class="info-item">
            <uni-icons type="calendar" size="18" color="#667eea"></uni-icons>
            <view class="info-content">
              <text class="info-label">创建时间</text>
              <text class="info-value">{{ formatCreateTime }}</text>
            </view>
          </view>
          <view class="info-item">
            <uni-icons type="person-filled" size="18" color="#764ba2"></uni-icons>
            <view class="info-content">
              <text class="info-label">参与人员</text>
              <text class="info-value">{{ memberCount }} 人</text>
            </view>
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

// 格式化创建时间
const formatCreateTime = computed(() => {
  if (!props.bookData.created_at) return '未知'
  const date = new Date(props.bookData.created_at)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日`
})

// 成员数量
const memberCount = computed(() => {
  // 如果有members字段，返回成员数量
  if (props.bookData.members && Array.isArray(props.bookData.members)) {
    return props.bookData.members.length
  }
  // 如果有member_count字段
  if (props.bookData.member_count !== undefined) {
    return props.bookData.member_count
  }
  // 默认至少有1个人（创建者）
  return 1
})

// 时间线数据
const timelineData = computed(() => {
  return props.tasksData
    .filter(task => task.status === 'completed' && task.completed_at)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at)) // 改为正序，最早完成的在前
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
  padding: 16px 30rpx;
  
  .info-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.95) 100%);
    backdrop-filter: blur(20rpx);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 
      0 10px 40px rgba(102, 126, 234, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.8) inset;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
      border-radius: 20px;
      opacity: 0;
      z-index: -1;
      transition: opacity 0.3s ease;
    }
    
    &:hover::before {
      opacity: 0.3;
    }
    
    .card-header {
      margin-bottom: 20px;
      
      .card-title {
        font-size: 20px;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 0.5px;
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
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.8);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
          }
          
          .stat-value {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            animation: pulse 2s ease-in-out infinite;
          }
          
          .stat-label {
            font-size: 13px;
            color: #666;
            font-weight: 500;
            letter-spacing: 0.3px;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      }
    }
    
    .book-info-row {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(102, 126, 234, 0.1);
      display: flex;
      justify-content: space-around;
      gap: 16px;
      
      .info-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 18px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 12px;
        flex: 1;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.8);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.12);
        }
        
        .info-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: center;
          text-align: center;
          
          .info-label {
            font-size: 12px;
            color: #666;
            font-weight: 500;
            letter-spacing: 0.2px;
          }
          
          .info-value {
            font-size: 16px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: 0.3px;
          }
        }
      }
    }
  }
  
  .timeline-section {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(15rpx);
    border-radius: 20px;
    padding: 20px;
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(255, 255, 255, 0.5) inset;
    
    .section-header {
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid rgba(102, 126, 234, 0.1);
      
      .section-title {
        font-size: 20px;
        font-weight: 600;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .section-subtitle {
        font-size: 13px;
        color: rgba(0, 0, 0, 0.5);
        margin-left: 12px;
        font-style: italic;
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