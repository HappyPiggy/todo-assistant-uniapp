<template>
  <view class="virtual-task-list">
    <scroll-view 
      scroll-y 
      class="virtual-scroll-container"
      :style="{ height: containerHeight }"
      @scroll="handleScroll"
      :scroll-top="scrollTop"
      :throttle="false"
    >
      <!-- 占位容器，撑起滚动高度 -->
      <view class="virtual-scroll-phantom" :style="{ height: totalHeight + 'px' }"></view>
      
      <!-- 实际渲染的任务列表 -->
      <view 
        class="virtual-scroll-content"
        :style="{ transform: `translateY(${startOffset}px)` }"
      >
        <view 
          v-for="(task, index) in visibleItems" 
          :key="task._id || task.id"
          class="timeline-item"
          @click="handleTaskClick(task)"
        >
          <!-- 时间节点 -->
          <view class="timeline-node" :class="getNodeClass(task)">
            <view class="node-dot" :style="{ backgroundColor: getNodeColor(task) }"></view>
            <view class="node-index">{{ task.displayIndex }}</view>
          </view>
          
          <!-- 任务信息卡片 -->
          <view class="task-card">
            <!-- 任务标题 -->
            <text class="task-title">{{ task.title }}</text>
            
            <!-- 完成时间 -->
            <text class="task-time">{{ formatCompletedTime(task.completedAt || task.completed_at) }}</text>
            
            <!-- 任务详情 -->
            <view class="task-details">
              <!-- 优先级 -->
              <view class="detail-item priority" v-if="task.priority">
                <text class="priority-badge" :class="`priority-${task.priority}`">
                  {{ getPriorityText(task.priority) }}
                </text>
              </view>
              
              <!-- 层级 -->
              <view class="detail-item level" v-if="task.level > 0">
                <text class="level-text">{{ getLevelText(task.level) }}</text>
              </view>
            </view>
            
            <!-- 标签 -->
            <view class="task-tags" v-if="task.tags && task.tags.length > 0">
              <view 
                v-for="(tag, tagIndex) in task.tags.slice(0, 3)" 
                :key="tagIndex"
                class="tag-item"
                :style="{ backgroundColor: getTagColor(tag) }"
              >
                <text class="tag-text">{{ getTagText(tag) }}</text>
              </view>
              <text v-if="task.tags.length > 3" class="more-tags">+{{ task.tags.length - 3 }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, nextTick } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  containerHeight: {
    type: String,
    default: '600rpx'
  },
  itemHeight: {
    type: Number,
    default: 120 // 每项的预估高度（像素）
  }
})

const emit = defineEmits(['task-click'])

// 虚拟滚动相关状态
const scrollTop = ref(0)
const startIndex = ref(0)
const endIndex = ref(0)
const startOffset = ref(0)

// 可见区域的缓冲区大小
const bufferSize = 5

// 计算总高度
const totalHeight = computed(() => {
  return props.items.length * props.itemHeight
})

// 计算可见项
const visibleItems = computed(() => {
  const start = Math.max(0, startIndex.value - bufferSize)
  const end = Math.min(props.items.length, endIndex.value + bufferSize)
  
  return props.items.slice(start, end).map((item, index) => ({
    ...item,
    displayIndex: start + index + 1
  }))
})

// 处理滚动事件
const handleScroll = (e) => {
  const scrollTop = e.detail.scrollTop
  updateVisibleRange(scrollTop)
}

// 更新可见范围
const updateVisibleRange = (scrollTop) => {
  // 计算可见区域高度
  const containerHeightPx = uni.upx2px(parseInt(props.containerHeight))
  
  // 计算起始和结束索引
  const start = Math.floor(scrollTop / props.itemHeight)
  const end = Math.ceil((scrollTop + containerHeightPx) / props.itemHeight)
  
  startIndex.value = start
  endIndex.value = end
  
  // 计算偏移量（带缓冲区）
  const actualStart = Math.max(0, start - bufferSize)
  startOffset.value = actualStart * props.itemHeight
}

// 处理任务点击
const handleTaskClick = (task) => {
  emit('task-click', task)
  uni.navigateTo({
    url: `/pages/tasks/detail?id=${task._id || task.id}`
  })
}

// 节点样式相关方法
const getNodeClass = (task) => {
  return {
    'node-urgent': task.priority === 'urgent',
    'node-high': task.priority === 'high',
    'node-medium': task.priority === 'medium',
    'node-low': task.priority === 'low'
  }
}

const getNodeColor = (task) => {
  const colorMap = {
    urgent: '#ff4d4f',
    high: '#ff7a45',
    medium: '#ffa940',
    low: '#52c41a'
  }
  return colorMap[task.priority] || '#1890ff'
}

// 格式化时间
const formatCompletedTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const time = `${hour}:${minute}`
  
  if (taskDate.getTime() === today.getTime()) {
    return `今天 ${time}`
  } else if (taskDate.getTime() === yesterday.getTime()) {
    return `昨天 ${time}`
  } else {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日 ${time}`
  }
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const textMap = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return textMap[priority] || '中'
}

// 获取层级文本
const getLevelText = (level) => {
  const levelMap = {
    0: '一级',
    1: '二级',
    2: '三级'
  }
  return levelMap[level] || '一级'
}

// 获取标签文本
const getTagText = (tag) => {
  return typeof tag === 'string' ? tag : (tag.name || tag.label || '')
}

// 获取标签颜色
const getTagColor = (tag) => {
  if (typeof tag === 'object' && tag.color) {
    return tag.color
  }
  // 默认颜色
  const colors = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#5856d6']
  const text = getTagText(tag)
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// 初始化
onMounted(() => {
  nextTick(() => {
    updateVisibleRange(0)
  })
})
</script>

<style lang="scss" scoped>
.virtual-task-list {
  width: 100%;
  
  .virtual-scroll-container {
    position: relative;
    overflow: hidden;
    
    .virtual-scroll-phantom {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      z-index: -1;
    }
    
    .virtual-scroll-content {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
    }
  }
  
  .timeline-item {
    display: flex;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:active {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .timeline-node {
      position: relative;
      width: 40px;
      height: 40px;
      margin-right: 12px;
      flex-shrink: 0;
      
      .node-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .node-index {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 10px;
        color: #fff;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
    }
    
    .task-card {
      flex: 1;
      background: #fff;
      border-radius: 8px;
      padding: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      
      .task-title {
        font-size: 14px;
        font-weight: 500;
        color: #333;
        display: block;
        margin-bottom: 4px;
      }
      
      .task-time {
        font-size: 12px;
        color: #999;
        display: block;
        margin-bottom: 6px;
      }
      
      .task-details {
        display: flex;
        gap: 8px;
        margin-bottom: 6px;
        
        .priority-badge {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          
          &.priority-urgent {
            background: #ffebee;
            color: #c62828;
          }
          
          &.priority-high {
            background: #fff3e0;
            color: #e65100;
          }
          
          &.priority-medium {
            background: #e3f2fd;
            color: #1565c0;
          }
          
          &.priority-low {
            background: #f1f8e9;
            color: #558b2f;
          }
        }
        
        .level-text {
          font-size: 11px;
          color: #666;
        }
      }
      
      .task-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        
        .tag-item {
          padding: 2px 6px;
          border-radius: 4px;
          background: #f0f0f0;
          
          .tag-text {
            font-size: 10px;
            color: #fff;
          }
        }
        
        .more-tags {
          font-size: 10px;
          color: #999;
          padding: 2px 4px;
        }
      }
    }
  }
}
</style>