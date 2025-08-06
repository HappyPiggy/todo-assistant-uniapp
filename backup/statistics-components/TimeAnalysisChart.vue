<template>
  <view class="time-analysis-chart">
    <!-- 完成趋势 -->
    <view class="chart-section">
      <view class="chart-header">
        <text class="chart-title">任务完成趋势</text>
        <text class="chart-subtitle">最近30天任务完成情况</text>
      </view>
      
      <!-- 趋势图表 -->
      <view class="trend-chart">
        <view class="chart-area">
          <!-- Y轴标签 -->
          <view class="y-axis">
            <text v-for="tick in yAxisTicks" :key="tick" class="y-tick">{{ tick }}</text>
          </view>
          
          <!-- 图表内容 -->
          <view class="chart-content">
            <!-- 网格线 -->
            <view class="grid-lines">
              <view 
                v-for="(line, index) in gridLines" 
                :key="index"
                class="grid-line"
                :style="{ bottom: line + '%' }"
              ></view>
            </view>
            
            <!-- 完成趋势线 -->
            <view class="trend-line completion" v-if="completionPoints.length > 0">
              <view 
                v-for="(point, index) in completionPoints" 
                :key="index"
                class="trend-point completion-point"
                :style="{ 
                  left: point.x + '%', 
                  bottom: point.y + '%' 
                }"
                @click="handlePointClick(point, 'completion')"
              >
                <view class="point-tooltip" v-if="point.showTooltip">
                  <text>{{ point.date }}</text>
                  <text>完成: {{ point.value }}个</text>
                </view>
              </view>
            </view>
            
            <!-- 创建趋势线 -->
            <view class="trend-line creation" v-if="creationPoints.length > 0">
              <view 
                v-for="(point, index) in creationPoints" 
                :key="index"
                class="trend-point creation-point"
                :style="{ 
                  left: point.x + '%', 
                  bottom: point.y + '%' 
                }"
                @click="handlePointClick(point, 'creation')"
              >
                <view class="point-tooltip" v-if="point.showTooltip">
                  <text>{{ point.date }}</text>
                  <text>创建: {{ point.value }}个</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- X轴标签 -->
        <view class="x-axis">
          <text v-for="(label, index) in xAxisLabels" :key="index" class="x-tick">
            {{ label }}
          </text>
        </view>
      </view>
      
      <!-- 图例 -->
      <view class="chart-legend">
        <view class="legend-item">
          <view class="legend-color completion"></view>
          <text class="legend-text">任务完成</text>
        </view>
        <view class="legend-item">
          <view class="legend-color creation"></view>
          <text class="legend-text">任务创建</text>
        </view>
      </view>
    </view>
    
    <!-- 工作效率热力图 -->
    <view class="chart-section">
      <view class="chart-header">
        <text class="chart-title">工作效率分析</text>
        <text class="chart-subtitle">按小时统计的任务完成情况</text>
      </view>
      
      <view class="heatmap-chart">
        <view class="heatmap-grid">
          <view 
            v-for="hour in 24" 
            :key="hour - 1"
            class="heatmap-cell"
            :class="getHeatmapClass(hour - 1)"
            :style="{ backgroundColor: getHeatmapColor(hour - 1) }"
            @click="handleHourClick(hour - 1)"
          >
            <text class="hour-label">{{ formatHour(hour - 1) }}</text>
            <text class="hour-count">{{ getHourCount(hour - 1) }}</text>
          </view>
        </view>
        
        <!-- 热力图图例 -->
        <view class="heatmap-legend">
          <text class="legend-label">完成任务数量:</text>
          <view class="legend-gradient">
            <view class="gradient-bar"></view>
            <view class="gradient-labels">
              <text class="gradient-min">0</text>
              <text class="gradient-max">{{ maxHourlyCount }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 统计摘要 -->
    <view class="chart-section">
      <view class="chart-header">
        <text class="chart-title">时间分析摘要</text>
      </view>
      
      <view class="summary-grid">
        <view class="summary-item">
          <text class="summary-value">{{ totalCompletedLast30Days }}</text>
          <text class="summary-label">30天完成</text>
        </view>
        
        <view class="summary-item">
          <text class="summary-value">{{ totalCreatedLast30Days }}</text>
          <text class="summary-label">30天创建</text>
        </view>
        
        <view class="summary-item">
          <text class="summary-value">{{ avgDailyCompletion }}</text>
          <text class="summary-label">日均完成</text>
        </view>
        
        <view class="summary-item">
          <text class="summary-value">{{ peakEfficiencyHour }}</text>
          <text class="summary-label">高效时段</text>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="isEmpty" class="empty-state">
      <uni-icons type="info" size="40" color="#999"></uni-icons>
      <text class="empty-text">暂无时间分析数据</text>
    </view>
  </view>
</template>

<script setup>
import { defineProps, computed, ref } from 'vue'

const props = defineProps({
  timeData: {
    type: Object,
    default: () => ({
      completionTrend: [],
      creationTrend: [],
      efficiencyByHour: []
    })
  }
})

const activeTooltip = ref(null)

// 是否为空状态
const isEmpty = computed(() => {
  const { completionTrend, creationTrend, efficiencyByHour } = props.timeData
  return (!completionTrend || completionTrend.length === 0) && 
         (!creationTrend || creationTrend.length === 0) &&
         (!efficiencyByHour || efficiencyByHour.length === 0)
})

// 图表数据处理
const chartData = computed(() => {
  const completion = props.timeData.completionTrend || []
  const creation = props.timeData.creationTrend || []
  
  // 取最近7天的数据用于显示（避免图表过于拥挤）
  const recentCompletion = completion.slice(-7)
  const recentCreation = creation.slice(-7)
  
  return { completion: recentCompletion, creation: recentCreation }
})

// Y轴最大值
const maxYValue = computed(() => {
  const completionMax = Math.max(...(chartData.value.completion.map(item => item.count) || [0]))
  const creationMax = Math.max(...(chartData.value.creation.map(item => item.count) || [0]))
  return Math.max(completionMax, creationMax, 1)
})

// Y轴刻度
const yAxisTicks = computed(() => {
  const max = maxYValue.value
  const ticks = []
  const step = Math.max(1, Math.ceil(max / 4))
  
  for (let i = 0; i <= max; i += step) {
    ticks.unshift(i) // 从上到下排列
  }
  
  return ticks
})

// 网格线位置
const gridLines = computed(() => {
  return yAxisTicks.value.map(tick => (tick / maxYValue.value) * 100)
})

// X轴标签
const xAxisLabels = computed(() => {
  return chartData.value.completion.map(item => {
    const date = new Date(item.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
})

// 完成趋势点坐标
const completionPoints = computed(() => {
  const data = chartData.value.completion
  if (!data || data.length === 0) return []
  
  return data.map((item, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: (item.count / maxYValue.value) * 100,
    value: item.count,
    date: new Date(item.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
    showTooltip: false
  }))
})

// 创建趋势点坐标
const creationPoints = computed(() => {
  const data = chartData.value.creation
  if (!data || data.length === 0) return []
  
  return data.map((item, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: (item.count / maxYValue.value) * 100,
    value: item.count,
    date: new Date(item.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
    showTooltip: false
  }))
})

// 按小时效率数据
const hourlyEfficiency = computed(() => {
  const efficiency = props.timeData.efficiencyByHour || []
  const hourMap = {}
  
  // 初始化24小时
  for (let i = 0; i < 24; i++) {
    hourMap[i] = 0
  }
  
  // 填充实际数据
  efficiency.forEach(item => {
    if (item.hour >= 0 && item.hour < 24) {
      hourMap[item.hour] = item.count
    }
  })
  
  return hourMap
})

// 每小时最大完成数
const maxHourlyCount = computed(() => {
  return Math.max(...Object.values(hourlyEfficiency.value), 1)
})

// 获取小时完成数
const getHourCount = (hour) => {
  return hourlyEfficiency.value[hour] || 0
}

// 获取热力图颜色
const getHeatmapColor = (hour) => {
  const count = getHourCount(hour)
  const intensity = count / maxHourlyCount.value
  
  if (intensity === 0) return '#f5f5f5'
  if (intensity <= 0.25) return '#e6f7ff'
  if (intensity <= 0.5) return '#91d5ff'
  if (intensity <= 0.75) return '#40a9ff'
  return '#1890ff'
}

// 获取热力图样式类
const getHeatmapClass = (hour) => {
  const count = getHourCount(hour)
  if (count === 0) return 'empty'
  if (count === maxHourlyCount.value) return 'peak'
  return 'active'
}

// 格式化小时
const formatHour = (hour) => {
  return hour.toString().padStart(2, '0') + ':00'
}

// 统计摘要数据
const totalCompletedLast30Days = computed(() => {
  return (props.timeData.completionTrend || [])
    .reduce((sum, item) => sum + item.count, 0)
})

const totalCreatedLast30Days = computed(() => {
  return (props.timeData.creationTrend || [])
    .reduce((sum, item) => sum + item.count, 0)
})

const avgDailyCompletion = computed(() => {
  const total = totalCompletedLast30Days.value
  const days = (props.timeData.completionTrend || []).length
  return days > 0 ? Math.round((total / days) * 10) / 10 : 0
})

const peakEfficiencyHour = computed(() => {
  const maxCount = maxHourlyCount.value
  const peakHour = Object.entries(hourlyEfficiency.value)
    .find(([hour, count]) => count === maxCount)?.[0]
  
  return peakHour ? formatHour(parseInt(peakHour)) : '--'
})

// 事件处理
const handlePointClick = (point, type) => {
  uni.showToast({
    title: `${point.date} ${type === 'completion' ? '完成' : '创建'}: ${point.value}个`,
    icon: 'none'
  })
}

const handleHourClick = (hour) => {
  const count = getHourCount(hour)
  uni.showToast({
    title: `${formatHour(hour)} 完成了 ${count} 个任务`,
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.time-analysis-chart {
  @include card-style;
}

.chart-section {
  margin-bottom: $margin-xl;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.chart-header {
  margin-bottom: $margin-base;
  text-align: center;
}

.chart-title {
  display: block;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin-bottom: $margin-xs;
}

.chart-subtitle {
  display: block;
  font-size: $font-size-sm;
  color: $text-secondary;
}

// 趋势图样式
.trend-chart {
  background-color: $bg-secondary;
  border-radius: $border-radius;
  padding: $padding-base;
  margin-bottom: $margin-base;
}

.chart-area {
  @include flex-start;
  height: 200rpx;
  position: relative;
}

.y-axis {
  @include flex-column;
  justify-content: space-between;
  width: 60rpx;
  height: 100%;
  margin-right: $margin-base;
}

.y-tick {
  font-size: $font-size-xs;
  color: $text-tertiary;
  text-align: right;
}

.chart-content {
  flex: 1;
  height: 100%;
  position: relative;
  border-left: 2rpx solid $border-color;
  border-bottom: 2rpx solid $border-color;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1rpx;
  background-color: $border-color-light;
}

.trend-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.trend-point {
  position: absolute;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  border: 2rpx solid #ffffff;
  transform: translate(-50%, 50%);
  cursor: pointer;
  
  &.completion-point {
    background-color: #52c41a;
  }
  
  &.creation-point {
    background-color: #1890ff;
  }
  
  &:active {
    transform: translate(-50%, 50%) scale(1.5);
  }
}

.point-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  padding: 8rpx 12rpx;
  border-radius: 4rpx;
  font-size: $font-size-xs;
  white-space: nowrap;
  
  text {
    display: block;
  }
}

.x-axis {
  @include flex-between;
  margin-top: $margin-sm;
  padding-left: 74rpx; // 对齐Y轴宽度
}

.x-tick {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.chart-legend {
  @include flex-center;
  gap: $margin-lg;
}

.legend-item {
  @include flex-center;
}

.legend-color {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: $margin-xs;
  
  &.completion {
    background-color: #52c41a;
  }
  
  &.creation {
    background-color: #1890ff;
  }
}

.legend-text {
  font-size: $font-size-sm;
  color: $text-secondary;
}

// 热力图样式
.heatmap-chart {
  background-color: $bg-secondary;
  border-radius: $border-radius;
  padding: $padding-base;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8rpx;
  margin-bottom: $margin-base;
}

.heatmap-cell {
  @include flex-center;
  flex-direction: column;
  aspect-ratio: 1;
  border-radius: $border-radius-small;
  border: 1rpx solid $border-color-light;
  padding: 8rpx;
  transition: all $transition-base;
  
  &.empty {
    opacity: 0.3;
  }
  
  &.peak {
    border-color: #1890ff;
    box-shadow: 0 0 8rpx rgba(24, 144, 255, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.hour-label {
  font-size: $font-size-xs;
  color: $text-primary;
  font-weight: $font-weight-semibold;
  margin-bottom: 4rpx;
}

.hour-count {
  font-size: $font-size-xs;
  color: $text-secondary;
}

.heatmap-legend {
  @include flex-between;
  align-items: center;
}

.legend-label {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.legend-gradient {
  @include flex-center;
}

.gradient-bar {
  width: 120rpx;
  height: 12rpx;
  background: linear-gradient(90deg, #f5f5f5, #e6f7ff, #91d5ff, #40a9ff, #1890ff);
  border-radius: 6rpx;
  margin: 0 $margin-sm;
}

.gradient-labels {
  @include flex-between;
  width: 120rpx;
}

.gradient-min,
.gradient-max {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

// 统计摘要样式
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $margin-base;
}

.summary-item {
  @include flex-center;
  flex-direction: column;
  padding: $padding-base;
  background-color: $bg-secondary;
  border-radius: $border-radius;
}

.summary-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin-bottom: $margin-xs;
}

.summary-label {
  font-size: $font-size-sm;
  color: $text-secondary;
}

// 空状态样式
.empty-state {
  @include flex-center;
  flex-direction: column;
  padding: $padding-xl;
  color: $text-tertiary;
}

.empty-text {
  font-size: $font-size-base;
  margin-top: $margin-sm;
}
</style>