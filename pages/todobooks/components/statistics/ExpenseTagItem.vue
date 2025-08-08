<template>
  <view class="tag-item-wrapper">
    <!-- 标签主体 -->
    <view 
      class="expense-tag-item" 
      :class="{ 'selected': selected, 'expanded': showTasks, 'clickable': true }"
      :style="selected ? {
        borderColor: item.color,
        backgroundColor: item.color + '10'
      } : {}"
      @tap="handleClick"
    >
      <!-- 颜色标识条 -->
      <view 
        class="color-indicator"
        :style="{ backgroundColor: item.color }"
      ></view>
      
      <!-- 标签内容 -->
      <view class="tag-content">
        <view class="tag-header">
          <text class="tag-name">{{ item.tagName }}</text>
          <view class="tag-header-right">
            <text class="tag-percentage">{{ item.percentage }}%</text>
            <text class="expand-icon" :class="{ 'rotated': showTasks }">▼</text>
          </view>
        </view>
        
        <view class="tag-details">
          <text class="tag-amount">{{ formatAmount(item.amount) }}</text>
          <text class="tag-count">({{ item.count }}笔)</text>
        </view>
      </view>
      
      <!-- 进度条 -->
      <view class="progress-bar">
        <view 
          class="progress-fill" 
          :style="{ 
            width: item.percentage + '%',
            backgroundColor: item.color + '60',
            boxShadow: `0 1px 3px ${item.color}30`
          }"
        ></view>
      </view>
    </view>
    
    <!-- 任务列表（展开时显示） -->
    <view class="task-list" :class="{ 'show': showTasks }" v-if="showTasks">
      <view class="task-list-header">
        <text class="task-list-title">相关任务 ({{ sortedTasks.length }}项)</text>
      </view>
      <view 
        v-for="task in sortedTasks" 
        :key="task._id"
        class="task-item"
        @tap="handleTaskClick(task, $event)"
      >
        <view class="task-info">
          <text class="task-title">{{ task.title || '无标题' }}</text>
          <text class="task-cost">¥{{ formatAmount(getTaskCost(task)) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  },
  selected: {
    type: Boolean,
    default: false
  },
  viewMode: {
    type: String,
    default: 'actual' // 'actual' 或 'budget'
  },
  forceExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'task-click'])

// 是否展开任务列表（内部状态）
const internalShowTasks = ref(false)

// 计算最终的展开状态（内部状态或外部强制状态）
const showTasks = computed(() => {
  return internalShowTasks.value || props.forceExpanded
})

// 平台检测
const platform = ref('')
const isMP = ref(false)
const isAndroid = ref(false)

// 平台特定的交互延迟
const clickDelay = computed(() => {
  return isAndroid.value ? 50 : 0 // Android端添加轻微延迟优化体验
})

// 格式化金额显示
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return '' + Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}


// 获取任务花费（根据视图模式）
const getTaskCost = (task) => {
  return props.viewMode === 'budget' ? (task.budget || 0) : (task.actual_cost || 0)
}

// 排序后的任务列表（按花费倒序，根据视图模式）
const sortedTasks = computed(() => {
  if (!props.item.tasks || !Array.isArray(props.item.tasks)) {
    return []
  }
  
  const sorted = [...props.item.tasks].sort((a, b) => {
    const aCost = getTaskCost(a)
    const bCost = getTaskCost(b)
    return bCost - aCost
  })
  
  return sorted
})

// 处理标签点击事件
const handleClick = () => {
  try {
    // 防止快速连续点击
    if (handleClick.lastClickTime && Date.now() - handleClick.lastClickTime < 200) {
      return
    }
    handleClick.lastClickTime = Date.now()
    
    // 应用平台特定的延迟
    if (clickDelay.value > 0) {
      setTimeout(() => {
        internalShowTasks.value = !internalShowTasks.value
        emit('click', props.item)
      }, clickDelay.value)
    } else {
      internalShowTasks.value = !internalShowTasks.value
      emit('click', props.item)
    }
  } catch (error) {
    console.error('标签点击处理异常:', error)
  }
}

// 处理任务点击事件
const handleTaskClick = (task, event) => {
  try {
    // 参数验证
    if (!task) {
      console.warn('任务点击事件：task参数为空')
      return
    }
    
    // 验证必要字段
    if (!task._id) {
      console.warn('任务点击事件：任务缺少_id字段', task)
      uni.showToast({
        title: '任务信息异常',
        icon: 'error'
      })
      return
    }
    
    // 微信小程序中阻止事件冒泡，避免触发父级展开/收起
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation()
    }
    
    // 防抖处理，避免快速连续点击
    if (handleTaskClick.lastClickTime && Date.now() - handleTaskClick.lastClickTime < 300) {
      console.log('任务点击防抖：忽略快速连续点击')
      return
    }
    handleTaskClick.lastClickTime = Date.now()
    
    console.log('任务点击事件处理:', task.title || '无标题', task._id)
    emit('task-click', task)
    
  } catch (error) {
    console.error('任务点击处理异常:', error)
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'error'
    })
  }
}

// 组件挂载时进行平台检测
onMounted(() => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    platform.value = systemInfo.platform || ''
    isAndroid.value = platform.value === 'android'
    
    // 检测是否是微信小程序环境
    // #ifdef MP-WEIXIN
    isMP.value = true
    // #endif
    
    console.log('平台信息:', {
      platform: platform.value,
      isAndroid: isAndroid.value,
      isMP: isMP.value
    })
  } catch (error) {
    console.warn('平台检测失败:', error)
  }
})

// 监听外部展开状态变化，同步内部状态
watch(() => props.forceExpanded, (newExpanded, oldExpanded) => {
  console.log(`ExpenseTagItem(${props.item?.tagName}) - forceExpanded变化:`, {
    from: oldExpanded,
    to: newExpanded,
    internalState: internalShowTasks.value
  })
  
  // 如果外部强制展开状态变化，重置内部状态
  if (newExpanded !== oldExpanded) {
    // 如果外部取消展开，也重置内部状态
    if (!newExpanded && internalShowTasks.value) {
      internalShowTasks.value = false
    }
  }
})

// 组件卸载时清理资源
onUnmounted(() => {
  try {
    // 清理静态方法上的时间戳，防止内存泄漏
    if (handleClick.lastClickTime) {
      delete handleClick.lastClickTime
    }
    if (handleTaskClick.lastClickTime) {
      delete handleTaskClick.lastClickTime
    }
    
    console.log('ExpenseTagItem组件资源清理完成')
  } catch (error) {
    console.warn('组件卸载清理失败:', error)
  }
})
</script>

<style lang="scss" scoped>
.expense-tag-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
  
  &.clickable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }
  
  &.selected {
    border: 2px solid;
    
    .color-indicator {
      width: 6px; // 选中时加宽颜色条
    }
  }
  
  &.expanded {
    border-radius: 12px 12px 0 0; // 展开时上方圆角
    
    .expand-icon {
      transform: rotate(180deg);
    }
  }
  
  .color-indicator {
    width: 4px;
    height: 100%;
    border-radius: 0 2px 2px 0;
    margin-right: 12px;
    flex-shrink: 0;
    transition: width 0.3s ease;
  }
  
  
  .tag-content {
    flex: 1;
    min-width: 0; // 防止内容溢出
  }
  
  .tag-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  
  .tag-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .expand-icon {
    font-size: 12px;
    color: #999;
    transition: transform 0.3s ease;
    
    &.rotated {
      transform: rotate(180deg);
    }
  }
  
  .tag-name {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .tag-percentage {
    font-size: 14px;
    font-weight: 600;
    color: #666;
    margin-left: 8px;
  }
  
  .tag-details {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .tag-amount {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }
  
  .tag-count {
    font-size: 12px;
    color: #999;
  }
  
  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px; // 稍微加高进度条
    background: #f5f5f5;
    border-radius: 0 0 12px 12px; // 与卡片圆角保持一致
    
    .progress-fill {
      height: 100%;
      transition: width 0.6s ease;
      border-radius: 0 0 12px 0; // 右下角保持圆角
    }
  }
}

// 任务列表样式
.task-list {
  background: rgba(248, 249, 250, 0.8);
  border-radius: 0 0 12px 12px;
  border: 1px solid #e9ecef;
  border-top: none;
  max-height: 0;
  overflow: hidden;
  transform: translateZ(0); // 启用硬件加速，Android性能优化
  backface-visibility: hidden; // Android动画性能优化
  transition: max-height 0.3s ease, padding 0.3s ease;
  
  // Android端兼容性优化
  -webkit-transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  
  &.show {
    max-height: 300px;
    padding: 12px 16px;
  }
  
  .task-list-header {
    margin-bottom: 8px;
    
    .task-list-title {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
  }
  
  .task-item {
    padding: 8px 12px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 6px;
    border: 1px solid #e9ecef;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &:hover {
      background: #f8f9fa;
      border-color: #007aff;
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
  
  .task-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .task-title {
    flex: 1;
    font-size: 14px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 8px;
  }
  
  .task-cost {
    font-size: 13px;
    color: #007aff;
    font-weight: 600;
    flex-shrink: 0;
  }
}

// 响应式适配
@media (max-width: 480px) {
  .expense-tag-item {
    padding: 12px;
    
    .color-indicator {
      width: 3px; // 小屏设备上颜色条稍窄
      margin-right: 10px;
    }
    
    .tag-name {
      font-size: 15px;
    }
    
    .tag-percentage {
      font-size: 13px;
    }
    
    .tag-amount {
      font-size: 16px;
    }
    
    .tag-count {
      font-size: 11px;
    }
  }
  
  .task-list {
    &.show {
      max-height: 250px;
      padding: 10px 12px;
    }
    
    .task-item {
      padding: 6px 10px;
    }
    
    .task-title {
      font-size: 13px;
    }
    
    .task-cost {
      font-size: 12px;
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .expense-tag-item {
    background: #1c1c1e;
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.06);
    
    .tag-name,
    .tag-amount {
      color: #fff;
    }
    
    .tag-percentage {
      color: #999;
    }
    
    .tag-count {
      color: #666;
    }
    
    .progress-bar {
      background: #2c2c2e;
    }
    
    &.selected {
      background: rgba(0, 122, 255, 0.1);
    }
  }
  
  .task-list {
    background: rgba(28, 28, 30, 0.8);
    border-color: #3a3a3e;
    
    .task-item {
      background: #2c2c2e;
      border-color: #3a3a3e;
      
      &:hover {
        background: #3a3a3e;
      }
    }
    
    .task-title {
      color: #fff;
    }
    
    .task-list-title {
      color: #999;
    }
  }
}
</style>