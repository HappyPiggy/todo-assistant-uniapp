<template>
  <view class="pie-chart-canvas">
    <canvas 
      :canvas-id="canvasId"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    ></canvas>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  chartData: {
    type: Array,
    default: () => []
  },
  canvasWidth: {
    type: Number,
    default: 300
  },
  canvasHeight: {
    type: Number,
    default: 300
  },
  selectedSegment: {
    type: String,
    default: null
  },
  showExtensionLabels: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['segment-click', 'canvas-ready'])

// Canvas 配置
const canvasId = `pie-chart-canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const ctx = ref(null)

// 绘制参数
const centerX = computed(() => props.canvasWidth / 2)
const centerY = computed(() => props.canvasHeight / 2)
const outerRadius = computed(() => Math.min(centerX.value, centerY.value) - 70) // 饼图更大，调整边距
const innerRadius = computed(() => outerRadius.value * 0.6)

// 扇形数据，包含角度信息
const segmentAngles = ref([])

// 悬停状态
const hoveredSegment = ref(null)

// 防抖定时器
let drawTimer = null

// 动画相关状态
const isAnimating = ref(false)
const animationProgress = ref(0)
let animationId = null

// 计算总金额
const totalAmount = computed(() => {
  return props.chartData.reduce((sum, item) => sum + (item.amount || 0), 0)
})

// 初始化Canvas上下文
const initCanvas = () => {
  try {
    ctx.value = uni.createCanvasContext(canvasId)
    emit('canvas-ready')
    return true
  } catch (error) {
    console.error('Canvas初始化失败:', error)
    return false
  }
}

// 绘制饼图（带防抖和动画）
const drawPieChart = (withAnimation = false) => {
  console.log('PieChartCanvas - drawPieChart 调用:', {
    chartData: props.chartData,
    chartDataLength: props.chartData?.length,
    withAnimation,
    canvasWidth: props.canvasWidth,
    canvasHeight: props.canvasHeight,
    ctxExists: !!ctx.value
  })
  
  if (!props.chartData || props.chartData.length === 0) {
    console.log('PieChartCanvas - 无数据，绘制空图表')
    drawEmptyChart()
    return
  }
  
  if (!ctx.value) {
    console.error('PieChartCanvas - Canvas上下文不存在，尝试重新初始化')
    if (initCanvas()) {
      // 重新调用绘制
      setTimeout(() => drawPieChart(withAnimation), 100)
    }
    return
  }
  
  // 清除之前的定时器
  if (drawTimer) {
    clearTimeout(drawTimer)
  }
  
  // 防抖处理
  drawTimer = setTimeout(() => {
    if (withAnimation) {
      drawPieChartWithAnimation()
    } else {
      drawPieChartCore()
    }
  }, 50)
}

// 带动画的绘制
const drawPieChartWithAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  isAnimating.value = true
  animationProgress.value = 0
  
  const startTime = Date.now()
  const duration = 800 // 800ms 动画时长
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用缓动函数
    const easedProgress = easeOutCubic(progress)
    animationProgress.value = easedProgress
    
    drawPieChartCore(easedProgress)
    
    if (progress < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      isAnimating.value = false
      animationProgress.value = 1
    }
  }
  
  animate()
}

// 缓动函数
const easeOutCubic = (t) => {
  return 1 - Math.pow(1 - t, 3)
}

// 绘制空图表
const drawEmptyChart = () => {
  if (!ctx.value) return
  
  ctx.value.clearRect(0, 0, props.canvasWidth, props.canvasHeight)
  
  // 绘制灰色环形
  ctx.value.setFillStyle('#f0f0f0')
  ctx.value.beginPath()
  ctx.value.arc(centerX.value, centerY.value, outerRadius.value, 0, 2 * Math.PI)
  ctx.value.arc(centerX.value, centerY.value, innerRadius.value, 0, 2 * Math.PI, true)
  ctx.value.fill()
  
  ctx.value.draw()
}

// 核心绘制逻辑
const drawPieChartCore = (animationProgress = 1) => {
  if (!ctx.value) return
  
  // 清空画布
  ctx.value.clearRect(0, 0, props.canvasWidth, props.canvasHeight)
  
  // 计算角度信息
  let currentAngle = -Math.PI / 2 // 从顶部开始
  const total = totalAmount.value
  segmentAngles.value = []
  
  if (total <= 0) {
    drawEmptyChart()
    return
  }
  
  // 绘制各个扇形
  props.chartData.forEach((item, index) => {
    if (item.amount <= 0) return
    
    const angle = (item.amount / total) * 2 * Math.PI * animationProgress
    const endAngle = currentAngle + angle
    const midAngle = (currentAngle + endAngle) / 2
    
    // 保存扇形角度信息用于点击检测
    segmentAngles.value.push({
      id: item.id,
      startAngle: currentAngle,
      endAngle: endAngle,
      midAngle: midAngle,
      data: item
    })
    
    // 判断是否为选中状态
    const isSelected = props.selectedSegment === item.id
    const isHovered = hoveredSegment.value === item.id
    let currentOuterRadius = outerRadius.value
    
    // 选中状态：外扩8px
    if (isSelected) {
      currentOuterRadius += 8
    }
    // 悬停状态：外扩4px
    else if (isHovered) {
      currentOuterRadius += 4
    }
    
    // 绘制扇形
    ctx.value.setFillStyle(item.color)
    ctx.value.beginPath()
    ctx.value.arc(centerX.value, centerY.value, currentOuterRadius, currentAngle, endAngle)
    ctx.value.arc(centerX.value, centerY.value, innerRadius.value, endAngle, currentAngle, true)
    ctx.value.closePath()
    ctx.value.fill()
    
    // 绘制分隔线
    ctx.value.setStrokeStyle('#fff')
    ctx.value.setLineWidth(2)
    ctx.value.beginPath()
    ctx.value.moveTo(
      centerX.value + Math.cos(currentAngle) * innerRadius.value,
      centerY.value + Math.sin(currentAngle) * innerRadius.value
    )
    ctx.value.lineTo(
      centerX.value + Math.cos(currentAngle) * currentOuterRadius,
      centerY.value + Math.sin(currentAngle) * currentOuterRadius
    )
    ctx.value.stroke()
    
    // 绘制延伸标签（占比>5%时）
    if (props.showExtensionLabels && item.showExtensionLabel && animationProgress === 1) {
      drawExtensionLabel(item, midAngle, currentOuterRadius)
    }
    
    currentAngle = endAngle
  })
  
  // 绘制中心白色圆
  ctx.value.setFillStyle('#fff')
  ctx.value.beginPath()
  ctx.value.arc(centerX.value, centerY.value, innerRadius.value - 1, 0, 2 * Math.PI)
  ctx.value.fill()
  
  ctx.value.draw()
}

// 绘制延伸标签
const drawExtensionLabel = (item, midAngle, radius) => {
  const labelDistance = 20 // 标签线长度，稍微缩短
  const textDistance = 30   // 文本距离中心的距离，稍微缩短
  
  // 计算标签线起点和终点
  const lineStartX = centerX.value + Math.cos(midAngle) * radius
  const lineStartY = centerY.value + Math.sin(midAngle) * radius
  const lineEndX = centerX.value + Math.cos(midAngle) * (radius + labelDistance)
  const lineEndY = centerY.value + Math.sin(midAngle) * (radius + labelDistance)
  
  // 绘制引导线
  ctx.value.setStrokeStyle(item.color)
  ctx.value.setLineWidth(1.5)
  ctx.value.beginPath()
  ctx.value.moveTo(lineStartX, lineStartY)
  ctx.value.lineTo(lineEndX, lineEndY)
  ctx.value.stroke()
  
  // 绘制标签文本
  const textX = centerX.value + Math.cos(midAngle) * (radius + textDistance)
  const textY = centerY.value + Math.sin(midAngle) * (radius + textDistance)
  
  // 截断过长的标签名称
  let displayName = item.tagName
  if (displayName.length > 6) {
    displayName = displayName.substring(0, 5) + '...'
  }
  
  // 根据角度调整文本对齐方式
  const isRightSide = Math.cos(midAngle) >= 0
  ctx.value.setTextAlign(isRightSide ? 'left' : 'right')
  ctx.value.setTextBaseline('middle')
  ctx.value.setFillStyle('#333')
  ctx.value.setFontSize(11) // 字体稍小一些
  ctx.value.fillText(displayName, textX, textY)
}

// 点击检测
const detectClickedSegment = (touchX, touchY) => {
  const dx = touchX - centerX.value
  const dy = touchY - centerY.value
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // 检查点击是否在环形区域内，扩大检测范围
  if (distance < innerRadius.value || distance > outerRadius.value + 20) {
    console.log('点击超出检测范围:', { distance, innerRadius: innerRadius.value, outerRadius: outerRadius.value })
    return null
  }
  
  // 计算点击角度
  let angle = Math.atan2(dy, dx)
  // 调整角度到与绘制时一致的起点（顶部）
  angle = angle + Math.PI / 2
  if (angle < 0) angle += 2 * Math.PI
  
  console.log('点击角度检测:', { 
    angle: angle * 180 / Math.PI, 
    segmentCount: segmentAngles.value.length 
  })
  
  // 查找对应的扇形
  for (const segment of segmentAngles.value) {
    let startAngle = segment.startAngle + Math.PI / 2
    let endAngle = segment.endAngle + Math.PI / 2
    
    if (startAngle < 0) startAngle += 2 * Math.PI
    if (endAngle < 0) endAngle += 2 * Math.PI
    
    console.log(`扇形 ${segment.data.tagName} 角度范围:`, {
      startAngle: startAngle * 180 / Math.PI,
      endAngle: endAngle * 180 / Math.PI,
      clickAngle: angle * 180 / Math.PI
    })
    
    // 处理跨越0度的情况
    if (endAngle < startAngle) {
      if (angle >= startAngle || angle <= endAngle) {
        console.log('匹配到扇形（跨0度）:', segment.data.tagName)
        return segment
      }
    } else {
      if (angle >= startAngle && angle <= endAngle) {
        console.log('匹配到扇形:', segment.data.tagName)
        return segment
      }
    }
  }
  
  return null
}

// 触摸开始事件
const handleTouchStart = (e) => {
  if (!e.touches || e.touches.length === 0) return
  
  const touch = e.touches[0]
  
  // 在uni-app中，可能需要使用不同的坐标计算方式
  let touchX, touchY
  if (e.currentTarget.getBoundingClientRect) {
    const rect = e.currentTarget.getBoundingClientRect()
    touchX = touch.clientX - rect.left
    touchY = touch.clientY - rect.top
  } else {
    // uni-app中的备用方案
    touchX = touch.x || touch.clientX
    touchY = touch.y || touch.clientY
  }
  
  console.log('触摸检测:', { 
    touchX, 
    touchY, 
    canvasWidth: props.canvasWidth, 
    canvasHeight: props.canvasHeight,
    centerX: centerX.value,
    centerY: centerY.value
  })
  
  const clickedSegment = detectClickedSegment(touchX, touchY)
  if (clickedSegment) {
    console.log('点击了扇形:', clickedSegment.data.tagName)
    emit('segment-click', clickedSegment.data)
  } else {
    console.log('未检测到扇形点击')
  }
}

// 触摸移动事件（用于悬停效果）
const handleTouchMove = (e) => {
  if (!e.touches || e.touches.length === 0) return
  
  const touch = e.touches[0]
  const rect = e.currentTarget.getBoundingClientRect ? e.currentTarget.getBoundingClientRect() : { left: 0, top: 0 }
  const touchX = touch.clientX - rect.left
  const touchY = touch.clientY - rect.top
  
  const hoveredSegmentData = detectClickedSegment(touchX, touchY)
  const newHoveredId = hoveredSegmentData ? hoveredSegmentData.data.id : null
  
  // 只在悬停状态改变时重绘
  if (hoveredSegment.value !== newHoveredId) {
    hoveredSegment.value = newHoveredId
    drawPieChartCore()
  }
}

// 触摸结束事件
const handleTouchEnd = (e) => {
  // 清除悬停状态
  if (hoveredSegment.value !== null) {
    hoveredSegment.value = null
    drawPieChartCore()
  }
}

// 强制重绘方法
const redraw = () => {
  nextTick(() => {
    drawPieChart()
  })
}

// 监听数据变化
watch(() => props.chartData, (newData) => {
  console.log('Canvas: 图表数据变化, 数据长度:', newData?.length || 0)
  nextTick(() => {
    drawPieChart()
  })
}, { deep: true, immediate: true })

// 监听选中状态变化
watch(() => props.selectedSegment, () => {
  nextTick(() => {
    drawPieChart()
  })
})

// 监听画布尺寸变化
watch([() => props.canvasWidth, () => props.canvasHeight], () => {
  nextTick(() => {
    drawPieChart()
  })
})

// 挂载时初始化
onMounted(() => {
  console.log('PieChartCanvas 挂载完成')
  
  nextTick(() => {
    if (initCanvas()) {
      // 延迟绘制，确保Canvas准备就绪，首次加载使用动画
      setTimeout(() => {
        drawPieChart(true) // 首次绘制使用动画
      }, 100)
    }
  })
})

// 清理动画资源
onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (drawTimer) {
    clearTimeout(drawTimer)
  }
})

// 暴露方法给父组件
defineExpose({
  redraw,
  detectClickedSegment
})
</script>

<style lang="scss" scoped>
.pie-chart-canvas {
  display: flex;
  justify-content: center;
  align-items: center;
  
  canvas {
    display: block;
  }
}
</style>