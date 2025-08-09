<template>
  <view class="pie-chart-test-page">
    <view class="page-header">
      <text class="page-title">跨平台饼图组件测试</text>
    </view>
    
    <view class="test-section">
      <view class="section-header">
        <text class="section-title">基础功能测试</text>
      </view>
      
      <!-- 测试组件 -->
      <view class="chart-wrapper">
        <CrossPlatformPieChart
          ref="chartRef"
          :chart-data="testData"
          :width="300"
          :height="300"
          :enable-animation="enableAnimation"
          :enable-interaction="true"
          :show-labels="true"
          @segment-click="handleSegmentClick"
          @canvas-ready="handleCanvasReady"
          @render-complete="handleRenderComplete"
          @error="handleError"
        />
      </view>
      
      <!-- 控制面板 -->
      <view class="control-panel">
        <view class="control-item">
          <text>启用动画</text>
          <switch :checked="enableAnimation" @change="handleAnimationToggle" />
        </view>
        
        <view class="control-item">
          <button @tap="refreshData">刷新数据</button>
          <button @tap="redrawChart">重新绘制</button>
        </view>
      </view>
    </view>
    
    <!-- 状态显示 -->
    <view class="status-section">
      <view class="section-header">
        <text class="section-title">组件状态</text>
      </view>
      
      <view class="status-info">
        <text class="info-item">平台: {{ platformInfo }}</text>
        <text class="info-item">渲染器: {{ rendererInfo }}</text>
        <text class="info-item">是否就绪: {{ isReady ? '是' : '否' }}</text>
        <text class="info-item">最后点击: {{ lastClickedSegment }}</text>
      </view>
    </view>
    
    <!-- 日志区域 -->
    <view class="log-section">
      <view class="section-header">
        <text class="section-title">运行日志</text>
        <button class="clear-log-btn" @tap="clearLogs">清除</button>
      </view>
      
      <scroll-view class="log-content" scroll-y>
        <view
          v-for="(log, index) in logs"
          :key="index"
          class="log-item"
          :class="log.level"
        >
          <text class="log-time">{{ log.time }}</text>
          <text class="log-message">{{ log.message }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CrossPlatformPieChart from '@/pages/todobooks/components/charts/CrossPlatformPieChart.vue'

// 测试数据
const testData = ref([
  {
    id: 'food',
    value: 1200,
    amount: 1200,
    color: '#FF6B6B',
    label: '餐饮',
    tagName: '餐饮'
  },
  {
    id: 'transport', 
    value: 800,
    amount: 800,
    color: '#4ECDC4',
    label: '交通',
    tagName: '交通'
  },
  {
    id: 'shopping',
    value: 2000,
    amount: 2000,
    color: '#45B7D1',
    label: '购物',
    tagName: '购物'
  },
  {
    id: 'entertainment',
    value: 600,
    amount: 600,
    color: '#96CEB4',
    label: '娱乐',
    tagName: '娱乐'
  },
  {
    id: 'other',
    value: 400,
    amount: 400,
    color: '#FFEAA7',
    label: '其他',
    tagName: '其他'
  }
])

// 控制状态
const enableAnimation = ref(true)
const chartRef = ref(null)
const isReady = ref(false)
const lastClickedSegment = ref('无')
const logs = ref([])

// 计算属性
const platformInfo = computed(() => {
  const capabilities = chartRef.value?.getCapabilities()
  return capabilities?.platform?.name || '未知'
})

const rendererInfo = computed(() => {
  const renderer = chartRef.value?.getRenderer()
  return renderer?.type || '未知'
})

// 日志记录
const addLog = (level, message) => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  
  logs.value.unshift({
    level,
    time,
    message
  })
  
  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// 事件处理
const handleSegmentClick = (data) => {
  lastClickedSegment.value = data.label || data.tagName || data.id
  addLog('info', `点击扇形: ${lastClickedSegment.value}`)
}

const handleCanvasReady = () => {
  isReady.value = true
  addLog('success', '组件初始化完成')
}

const handleRenderComplete = () => {
  addLog('info', '渲染完成')
}

const handleError = (error) => {
  addLog('error', `发生错误: ${error.message || error}`)
}

const handleAnimationToggle = (e) => {
  enableAnimation.value = e.detail.value
  addLog('info', `动画已${enableAnimation.value ? '启用' : '禁用'}`)
}

// 控制方法
const refreshData = () => {
  // 随机生成新数据
  testData.value = testData.value.map(item => ({
    ...item,
    value: Math.floor(Math.random() * 2000) + 100,
    amount: Math.floor(Math.random() * 2000) + 100
  }))
  addLog('info', '数据已刷新')
}

const redrawChart = () => {
  if (chartRef.value?.redraw) {
    chartRef.value.redraw()
    addLog('info', '手动重绘图表')
  }
}

const clearLogs = () => {
  logs.value = []
}

// 生命周期
onMounted(() => {
  addLog('info', '测试页面加载完成')
})
</script>

<style lang="scss" scoped>
.pie-chart-test-page {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
  
  .page-title {
    font-size: 20px;
    font-weight: bold;
    color: #333;
  }
}

.test-section, .status-section, .log-section {
  background-color: white;
  border-radius: 8px;
  margin-bottom: 20px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
  }
  
  .clear-log-btn {
    padding: 4px 8px;
    font-size: 12px;
    background-color: #f0f0f0;
    border-radius: 4px;
  }
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  padding: 20px;
  border: 1px dashed #ddd;
  border-radius: 8px;
}

.control-panel {
  .control-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    button {
      margin-left: 8px;
      padding: 6px 12px;
      font-size: 14px;
      background-color: #007AFF;
      color: white;
      border-radius: 4px;
      border: none;
      
      &:active {
        background-color: #0056CC;
      }
    }
  }
}

.status-info {
  .info-item {
    display: block;
    margin-bottom: 8px;
    color: #666;
    font-size: 14px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.log-section {
  .log-content {
    max-height: 200px;
    background-color: #f8f8f8;
    border-radius: 4px;
    padding: 8px;
  }
  
  .log-item {
    display: flex;
    margin-bottom: 4px;
    font-size: 12px;
    
    &.info {
      color: #666;
    }
    
    &.success {
      color: #52c41a;
    }
    
    &.error {
      color: #ff4d4f;
    }
    
    .log-time {
      margin-right: 8px;
      color: #999;
      min-width: 60px;
    }
    
    .log-message {
      flex: 1;
    }
  }
}
</style>