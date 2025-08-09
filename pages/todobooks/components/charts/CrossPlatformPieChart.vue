<template>
  <view class="cross-platform-pie-chart">
    <!-- 错误状态 -->
    <view v-if="error" class="error-state">
      <text class="error-icon">⚠️</text>
      <text class="error-text">{{ error }}</text>
      <view class="retry-button" @tap="handleRetry">
        <text>重试</text>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view v-else-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">图表加载中...</text>
    </view>
    
    <!-- 正常内容 -->
    <template v-else>
      <!-- 无数据状态 -->
      <view v-if="!chartData || chartData.length === 0" class="empty-state">
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无数据</text>
        <text class="empty-hint">请提供图表数据</text>
      </view>
      
      <!-- Canvas渲染方案 -->
      <template v-else-if="useCanvasRenderer">
        <view class="chart-container">
          <canvas 
            :canvas-id="canvasId"
            :style="canvasStyle"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          />
        </view>
      </template>
      
      <!-- CSS降级方案：显示提示信息 -->
      <template v-else>
        <view class="fallback-container" :style="canvasStyle">
          <view class="fallback-message">
            <text class="fallback-icon">📊</text>
            <text class="fallback-text">饼图未正常显示</text>
            <text class="fallback-hint">请查看下方数据列表</text>
          </view>
        </view>
      </template>
    </template>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch, onMounted, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import { detectCapabilities } from './utils/platformDetection.js'
import { createRenderer } from './renderers/RendererFactory.js'
import { getCanvasCoordinates } from './utils/coordinateHelper.js'

const props = defineProps({
  // 数据属性
  chartData: {
    type: Array,
    default: () => []
  },
  width: {
    type: Number,
    default: 300
  },
  height: {
    type: Number,
    default: 300
  },
  
  // 功能开关
  enableAnimation: {
    type: Boolean,
    default: null // null表示自动检测
  },
  enableInteraction: {
    type: Boolean,
    default: true
  },
  showLabels: {
    type: Boolean,
    default: true
  },
  
  // 样式配置
  innerRadiusRatio: {
    type: Number,
    default: 0.6
  },
  selectedOffset: {
    type: Number,
    default: 8
  },
  hoverOffset: {
    type: Number,
    default: 4
  },
  
  // 兼容性属性
  canvasWidth: {
    type: Number,
    default: null
  },
  canvasHeight: {
    type: Number,
    default: null
  },
  selectedSegment: {
    type: String,
    default: null
  },
  showExtensionLabels: {
    type: Boolean,
    default: null
  }
})

const emit = defineEmits([
  'segment-click', 
  'canvas-ready', 
  'render-complete',
  'error',
  'fallback-mode' // 新增：通知父组件当前使用降级模式
])

// 状态管理
const loading = ref(true)
const error = ref(null)
const isInitialized = ref(false)

// 平台能力检测结果
const capabilities = ref(null)
const renderer = ref(null)

// Canvas配置
const canvasId = `cross-platform-pie-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const ctx = ref(null)

// 计算属性
const actualWidth = computed(() => props.canvasWidth || props.width)
const actualHeight = computed(() => props.canvasHeight || props.height)
const actualShowLabels = computed(() => props.showExtensionLabels !== null ? props.showExtensionLabels : props.showLabels)
const actualEnableAnimation = computed(() => {
  if (props.enableAnimation !== null) return props.enableAnimation
  return capabilities.value?.shouldEnableAnimations || false
})

const canvasStyle = computed(() => ({
  width: actualWidth.value + 'px',
  height: actualHeight.value + 'px'
}))

const useCanvasRenderer = computed(() => {
  return capabilities.value?.canUseCanvas && !error.value
})

// 初始化
const initialize = async () => {
  try {
    loading.value = true
    error.value = null
    
    console.log('CrossPlatformPieChart - 开始初始化')
    
    // 检测平台能力
    capabilities.value = detectCapabilities()
    console.log('平台能力检测完成:', capabilities.value)
    
    if (useCanvasRenderer.value) {
      await initializeCanvasRenderer()
      // 通知父组件使用Canvas渲染
      emit('fallback-mode', false)
    } else {
      console.log('使用CSS降级方案')
      isInitialized.value = true
      // 通知父组件使用降级模式
      emit('fallback-mode', true)
      // 延迟触发渲染完成事件
      setTimeout(() => {
        emit('render-complete')
      }, 10)
    }
    
    loading.value = false
    emit('canvas-ready')
    
  } catch (err) {
    console.error('初始化失败:', err)
    error.value = '组件初始化失败'
    loading.value = false
    emit('error', err)
  }
}

// 初始化Canvas渲染器
const initializeCanvasRenderer = async (retryCount = 0) => {
  try {
    console.log(`尝试初始化渲染器 (第${retryCount + 1}次)`)
    
    // 创建渲染器实例
    renderer.value = createRenderer(capabilities.value)
    console.log('渲染器创建成功:', renderer.value.getInfo())
    
    // 初始化渲染器
    const success = await renderer.value.init(canvasId, getCurrentInstance())
    
    if (success) {
      console.log('渲染器初始化成功')
      isInitialized.value = true
      
      // 如果有数据，立即渲染
      nextTick(() => {
        if (props.chartData && props.chartData.length > 0) {
          renderChart()
        }
      })
      
      return true
    } else {
      throw new Error('渲染器初始化失败')
    }
    
  } catch (err) {
    console.error(`渲染器初始化失败 (第${retryCount + 1}次):`, err)
    
    if (retryCount < 2) {
      // 重试
      const delay = (retryCount + 1) * 300
      console.log(`${delay}ms后重试初始化`)
      setTimeout(() => {
        initializeCanvasRenderer(retryCount + 1)
      }, delay)
    } else {
      console.error('渲染器初始化重试次数用尽，切换到CSS方案')
      // 强制使用CSS方案
      capabilities.value = {
        ...capabilities.value,
        canUseCanvas: false
      }
      // 创建CSS渲染器
      renderer.value = createRenderer({
        ...capabilities.value,
        canUseCanvas: false,
        recommendedRenderer: 'css'
      })
      await renderer.value.init(canvasId)
      isInitialized.value = true
    }
  }
}

// 创建Canvas上下文
const createCanvasContext = async () => {
  // #ifdef H5
  // Web环境暂时使用简单方式
  ctx.value = { isWeb: true }
  return
  // #endif
  
  // #ifdef MP-WEIXIN
  ctx.value = uni.createCanvasContext(canvasId, this)
  return
  // #endif
  
  // #ifdef APP-PLUS
  ctx.value = uni.createCanvasContext(canvasId)
  return
  // #endif
  
  // 默认情况
  throw new Error('不支持的平台')
}

// 渲染图表
const renderChart = () => {
  if (!isInitialized.value || !renderer.value || !props.chartData?.length) return
  
  console.log('开始渲染图表，数据长度:', props.chartData.length)
  
  try {
    const drawOptions = {
      animationProgress: 1,
      selectedSegment: props.selectedSegment,
      showLabels: actualShowLabels.value,
      width: actualWidth.value,
      height: actualHeight.value,
      innerRadiusRatio: props.innerRadiusRatio,
      selectedOffset: props.selectedOffset,
      hoverOffset: props.hoverOffset
    }
    
    renderer.value.draw(props.chartData, drawOptions)
    emit('render-complete')
    
  } catch (error) {
    console.error('渲染失败:', error)
    emit('error', error)
  }
}

// 事件处理
const handleTouchStart = async (e) => {
  if (!props.enableInteraction || !renderer.value?.supportsInteraction()) return
  
  console.log('触摸开始事件')
  
  try {
    // 使用通用坐标获取函数
    const platformType = capabilities.value?.platform?.type
    
    // #ifdef H5
    const canvasElement = e.currentTarget
    // #endif
    // #ifndef H5
    const canvasElement = null
    // #endif
    
    const coordinates = await getCanvasCoordinates(
      e, 
      canvasId, 
      platformType,
      canvasElement
    )
    
    console.log('触摸坐标:', coordinates)
    
    // 使用渲染器检测点击的扇形
    const clickedSegment = renderer.value.detectClickedSegment(coordinates.x, coordinates.y)
    if (clickedSegment) {
      console.log('点击了扇形:', clickedSegment.data)
      emit('segment-click', clickedSegment.data)
    }
    
  } catch (error) {
    console.error('触摸事件处理失败:', error)
  }
}

const handleTouchMove = (e) => {
  if (!props.enableInteraction || !renderer.value?.supportsInteraction()) return
  // TODO: 实现悬停效果（如果支持）
}

const handleTouchEnd = (e) => {
  if (!props.enableInteraction || !renderer.value?.supportsInteraction()) return
  // TODO: 清除悬停状态
}

const handleRetry = () => {
  initialize()
}

// 数据变化监听
watch(() => props.chartData, (newData) => {
  console.log('图表数据变化, 新数据长度:', newData?.length || 0)
  if (isInitialized.value) {
    nextTick(() => {
      renderChart()
    })
  }
}, { deep: true, immediate: false })

// 尺寸变化监听
watch([() => props.width, () => props.height, () => props.canvasWidth, () => props.canvasHeight], () => {
  if (isInitialized.value) {
    nextTick(() => {
      renderChart()
    })
  }
})

// 生命周期
onMounted(() => {
  console.log('CrossPlatformPieChart 组件挂载')
  
  // 延迟初始化确保DOM完全渲染
  setTimeout(() => {
    initialize()
  }, 100)
})

onBeforeUnmount(() => {
  console.log('CrossPlatformPieChart 组件卸载')
  
  // 清理渲染器资源
  if (renderer.value) {
    renderer.value.destroy()
    renderer.value = null
  }
  
  // 清理其他资源
  capabilities.value = null
  ctx.value = null
})

// 暴露方法给父组件
defineExpose({
  redraw: renderChart,
  getCapabilities: () => capabilities.value,
  isReady: () => isInitialized.value,
  getRenderer: () => renderer.value,
  detectClickedSegment: (x, y) => renderer.value?.detectClickedSegment(x, y)
})
</script>

<style lang="scss" scoped>
.cross-platform-pie-chart {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

// 错误状态
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #666;
  
  .error-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  .error-text {
    font-size: 14px;
    margin-bottom: 16px;
    text-align: center;
  }
  
  .retry-button {
    padding: 8px 16px;
    background-color: #007AFF;
    border-radius: 4px;
    
    text {
      color: white;
      font-size: 14px;
    }
  }
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007AFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    margin-top: 12px;
    font-size: 14px;
    color: #666;
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #999;
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  .empty-text {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .empty-hint {
    font-size: 12px;
    color: #ccc;
  }
}

// 图表容器
.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  
  canvas {
    display: block;
  }
}

// 降级提示容器
.fallback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ddd;
  border-radius: 8px;
  background-color: #fafafa;
  
  .fallback-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
    
    .fallback-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.6;
    }
    
    .fallback-text {
      font-size: 16px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .fallback-hint {
      font-size: 12px;
      color: #999;
    }
  }
}

// 动画
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>