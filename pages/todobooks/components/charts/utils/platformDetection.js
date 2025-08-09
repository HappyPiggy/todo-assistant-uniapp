/**
 * 平台检测和能力检测工具
 * 用于跨平台饼图组件的适配
 */

/**
 * 检测当前运行平台
 */
export function detectPlatform() {
  const systemInfo = uni.getSystemInfoSync()
  
  // #ifdef H5
  return {
    type: 'web',
    name: 'H5',
    version: navigator.userAgent,
    isWeb: true,
    isMiniProgram: false,
    isApp: false
  }
  // #endif
  
  // #ifdef MP-WEIXIN
  return {
    type: 'miniprogram',
    name: 'WeChat',
    version: systemInfo.version,
    isWeb: false,
    isMiniProgram: true,
    isApp: false
  }
  // #endif
  
  // #ifdef APP-PLUS
  return {
    type: 'app',
    name: systemInfo.platform,
    version: systemInfo.system,
    isWeb: false,
    isMiniProgram: false,
    isApp: true,
    isAndroid: systemInfo.platform === 'android',
    isiOS: systemInfo.platform === 'ios'
  }
  // #endif
  
  // 默认情况
  return {
    type: 'unknown',
    name: 'Unknown',
    version: '0.0.0',
    isWeb: false,
    isMiniProgram: false,
    isApp: false
  }
}

/**
 * 检测Canvas支持能力
 */
export function detectCanvasCapabilities() {
  const capabilities = {
    hasCanvas: false,
    hasCanvas2D: false,
    hasCanvasContext: false,
    canCreateContext: false
  }
  
  try {
    // #ifdef H5
    // Web环境检测
    const canvas = document.createElement('canvas')
    capabilities.hasCanvas = !!canvas
    capabilities.hasCanvas2D = !!(canvas.getContext && canvas.getContext('2d'))
    capabilities.hasCanvasContext = capabilities.hasCanvas2D
    capabilities.canCreateContext = capabilities.hasCanvas2D
    // #endif
    
    // #ifndef H5
    // 非Web环境，假设支持uni.createCanvasContext
    capabilities.hasCanvas = true
    capabilities.hasCanvasContext = typeof uni.createCanvasContext === 'function'
    capabilities.canCreateContext = capabilities.hasCanvasContext
    // #endif
    
  } catch (error) {
    console.warn('Canvas能力检测失败:', error)
  }
  
  return capabilities
}

/**
 * 检测动画支持能力
 */
export function detectAnimationCapabilities() {
  const capabilities = {
    hasRAF: false,
    hasSetTimeout: true,
    hasCSSAnimation: false,
    hasTransitions: false,
    preferredMethod: 'setTimeout'
  }
  
  try {
    // #ifdef H5
    // Web环境检测
    capabilities.hasRAF = typeof requestAnimationFrame === 'function'
    capabilities.hasCSSAnimation = true
    capabilities.hasTransitions = true
    capabilities.preferredMethod = capabilities.hasRAF ? 'requestAnimationFrame' : 'setTimeout'
    // #endif
    
    // #ifndef H5
    // 非Web环境
    capabilities.hasRAF = false
    capabilities.preferredMethod = 'setTimeout'
    // #endif
    
  } catch (error) {
    console.warn('动画能力检测失败:', error)
  }
  
  return capabilities
}

/**
 * 检测触摸事件支持能力
 */
export function detectTouchCapabilities() {
  const capabilities = {
    hasTouchEvents: false,
    hasPointerEvents: false,
    hasMouseEvents: true,
    supportsPreciseCoordinates: false,
    supportsHover: false
  }
  
  try {
    // #ifdef H5
    // Web环境检测
    capabilities.hasTouchEvents = 'ontouchstart' in window
    capabilities.hasPointerEvents = 'onpointerdown' in window
    capabilities.supportsPreciseCoordinates = true
    capabilities.supportsHover = !capabilities.hasTouchEvents // 非触摸设备支持悬停
    // #endif
    
    // #ifdef MP-WEIXIN
    // 微信小程序
    capabilities.hasTouchEvents = true
    capabilities.supportsPreciseCoordinates = true
    capabilities.supportsHover = false
    // #endif
    
    // #ifdef APP-PLUS
    // App环境
    capabilities.hasTouchEvents = true
    capabilities.supportsPreciseCoordinates = false // App端坐标可能不够精确
    capabilities.supportsHover = false
    // #endif
    
  } catch (error) {
    console.warn('触摸能力检测失败:', error)
  }
  
  return capabilities
}

/**
 * 检测设备性能等级
 */
export function detectPerformanceLevel() {
  const systemInfo = uni.getSystemInfoSync()
  let performanceLevel = 'medium' // low, medium, high
  
  try {
    // #ifdef H5
    // Web环境性能检测
    if (navigator.hardwareConcurrency) {
      const cores = navigator.hardwareConcurrency
      if (cores >= 8) performanceLevel = 'high'
      else if (cores >= 4) performanceLevel = 'medium'
      else performanceLevel = 'low'
    }
    
    // 检测内存（如果可用）
    if (navigator.deviceMemory) {
      const memory = navigator.deviceMemory
      if (memory >= 8) performanceLevel = 'high'
      else if (memory >= 4) performanceLevel = 'medium'
      else performanceLevel = 'low'
    }
    // #endif
    
    // #ifndef H5
    // 非Web环境，基于系统信息推断
    const brand = systemInfo.brand?.toLowerCase() || ''
    const model = systemInfo.model?.toLowerCase() || ''
    
    // 高端品牌和型号
    const highEndBrands = ['iphone', 'samsung', 'huawei', 'xiaomi']
    const isHighEndBrand = highEndBrands.some(brandName => brand.includes(brandName))
    
    if (isHighEndBrand) {
      performanceLevel = 'high'
    } else if (systemInfo.platform === 'ios') {
      performanceLevel = 'high' // iOS设备通常性能较好
    }
    // #endif
    
  } catch (error) {
    console.warn('性能检测失败:', error)
  }
  
  return {
    level: performanceLevel,
    shouldEnableAnimation: performanceLevel !== 'low',
    shouldUseCaching: performanceLevel === 'high',
    maxFPS: performanceLevel === 'high' ? 60 : performanceLevel === 'medium' ? 30 : 15
  }
}

/**
 * 综合能力检测
 */
export function detectCapabilities() {
  const platform = detectPlatform()
  const canvas = detectCanvasCapabilities()
  const animation = detectAnimationCapabilities()
  const touch = detectTouchCapabilities()
  const performance = detectPerformanceLevel()
  
  console.log('平台能力检测结果:', {
    platform,
    canvas,
    animation,
    touch,
    performance
  })
  
  return {
    platform,
    canvas,
    animation,
    touch,
    performance,
    // 综合判断
    canUseCanvas: canvas.canCreateContext,
    canUseAnimation: animation.hasRAF || animation.hasSetTimeout,
    canUsePreciseTouch: touch.supportsPreciseCoordinates,
    shouldEnableAnimations: performance.shouldEnableAnimation && animation.preferredMethod !== 'none',
    recommendedRenderer: determineRecommendedRenderer(platform, canvas, performance)
  }
}

/**
 * 根据能力检测结果推荐渲染器
 */
function determineRecommendedRenderer(platform, canvas, performance) {
  if (!canvas.canCreateContext) {
    return 'css'
  }
  
  if (platform.isWeb) {
    return performance.level === 'high' ? 'web-enhanced' : 'web-basic'
  }
  
  if (platform.isMiniProgram) {
    return 'weixin'
  }
  
  if (platform.isApp) {
    return performance.level === 'low' ? 'app-basic' : 'app-standard'
  }
  
  return 'fallback'
}