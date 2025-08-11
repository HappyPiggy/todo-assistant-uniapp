<template>
  <view class="expense-pie-chart">
    <canvas 
      canvas-id="expense-pie-chart"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      @touchstart="handleTouchStart"
    ></canvas>
    
    <!-- 中心显示总额 -->
    <view class="chart-center">
      <text class="center-label">{{ viewMode === 'actual' ? '总支出' : '总预算' }}</text>
      <text class="center-value">{{ formatAmount(totalAmount) }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, onMounted, nextTick, watch } from 'vue'

const props = defineProps({
  chartData: {
    type: Array,
    default: () => []
  },
  viewMode: {
    type: String,
    default: 'actual'
  }
})

// Canvas 配置
const canvasId = 'expense-pie-chart'
const canvasWidth = ref(300)
const canvasHeight = ref(300)

// 计算总额
const totalAmount = computed(() => {
  return props.chartData.reduce((sum, item) => sum + (item.value || 0), 0)
})

// 格式化金额
const formatAmount = (amount) => {
  return Number(amount).toFixed(2)
}

// 防抖定时器
let drawTimer = null

// 绘制饼图（带防抖）
const drawPieChart = () => {
  if (!props.chartData || props.chartData.length === 0) return
  
  // 清除之前的定时器
  if (drawTimer) {
    clearTimeout(drawTimer)
  }
  
  // 防抖处理，确保在500ms内完成渲染
  drawTimer = setTimeout(() => {
    drawPieChartCore()
  }, 50)
}

// 核心绘制逻辑
const drawPieChartCore = () => {
  const ctx = uni.createCanvasContext(canvasId)
  const centerX = canvasWidth.value / 2
  const centerY = canvasHeight.value / 2
  const radius = Math.min(centerX, centerY) - 30
  const innerRadius = radius * 0.6 // 环形图内圆半径
  
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  // 计算角度
  let currentAngle = -Math.PI / 2 // 从顶部开始
  const total = totalAmount.value
  
  if (total === 0) {
    // 无数据时绘制灰色圆环
    ctx.setFillStyle('#f0f0f0')
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, true)
    ctx.fill()
  } else {
    // 绘制各个扇形
    props.chartData.forEach((item, index) => {
      if (item.value <= 0) return
      
      const angle = (item.value / total) * 2 * Math.PI
      const endAngle = currentAngle + angle
      
      // 绘制扇形
      ctx.setFillStyle(item.color || getDefaultColor(index))
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, currentAngle, endAngle)
      ctx.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true)
      ctx.closePath()
      ctx.fill()
      
      // 绘制分隔线
      ctx.setStrokeStyle('#fff')
      ctx.setLineWidth(2)
      ctx.beginPath()
      ctx.moveTo(
        centerX + Math.cos(currentAngle) * innerRadius,
        centerY + Math.sin(currentAngle) * innerRadius
      )
      ctx.lineTo(
        centerX + Math.cos(currentAngle) * radius,
        centerY + Math.sin(currentAngle) * radius
      )
      ctx.stroke()
      
      currentAngle = endAngle
    })
  }
  
  // 绘制中心白色圆（遮盖，形成环形效果）
  ctx.setFillStyle('#fff')
  ctx.beginPath()
  ctx.arc(centerX, centerY, innerRadius - 1, 0, 2 * Math.PI)
  ctx.fill()
  
  ctx.draw()
}

// 获取默认颜色
const getDefaultColor = (index) => {
  const colors = [
    '#007aff', '#34c759', '#ff9500', '#ff3b30', '#5856d6',
    '#af52de', '#ff2d55', '#5ac8fa', '#ffcc00', '#ff6b6b'
  ]
  return colors[index % colors.length]
}

// 处理触摸事件（预留交互）
const handleTouchStart = (e) => {
  // 可以在这里添加点击扇形的交互逻辑
  console.log('Chart touched', e)
}

// 监听数据变化重新绘制
watch(() => props.chartData, (newData, oldData) => {
  console.log('图表数据变化:', {
    新数据长度: newData?.length || 0,
    旧数据长度: oldData?.length || 0,
    视图模式: props.viewMode
  })
  
  // 确保数据有效且组件已挂载
  if (newData && newData.length > 0) {
    nextTick(() => {
      drawPieChart()
    })
  }
}, { deep: true, immediate: true })

watch(() => props.viewMode, (newMode) => {
  console.log('视图模式变化:', newMode)
  nextTick(() => {
    drawPieChart()
  })
})

// 挂载时绘制
onMounted(() => {
  console.log('饼图组件挂载完成')
  // 获取屏幕宽度，自适应画布大小
  const systemInfo = uni.getSystemInfoSync()
  const screenWidth = systemInfo.windowWidth
  const chartSize = Math.min(screenWidth - 80, 300)
  canvasWidth.value = chartSize
  canvasHeight.value = chartSize
  
  // 延迟绘制，确保父组件数据已准备好
  nextTick(() => {
    if (props.chartData && props.chartData.length > 0) {
      console.log('挂载时绘制图表，数据长度:', props.chartData.length)
      drawPieChart()
    } else {
      console.log('挂载时无数据，等待数据加载')
      // 增加重试机制，等待数据加载
      setTimeout(() => {
        if (props.chartData && props.chartData.length > 0) {
          console.log('延迟重试绘制图表，数据长度:', props.chartData.length)
          drawPieChart()
        }
      }, 200)
    }
  })
})
</script>

<style lang="scss" scoped>
.expense-pie-chart {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px auto;
  
  canvas {
    display: block;
  }
  
  .chart-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: none;
    
    .center-label {
      display: block;
      font-size: 12px;
      color: #999;
      margin-bottom: 4px;
    }
    
    .center-value {
      display: block;
      font-size: 20px;
      font-weight: bold;
      color: #333;
    }
  }
}
</style>