/**
 * 基础渲染器抽象类
 * 定义了所有渲染器需要实现的接口
 */

export class BaseRenderer {
  constructor(capabilities = {}) {
    this.capabilities = capabilities
    this.canvasId = null
    this.ctx = null
    this.isInitialized = false
    this.renderState = {
      isAnimating: false,
      selectedSegmentId: null,
      hoveredSegmentId: null,
      lastRenderTime: 0,
      renderCount: 0
    }
    
    // 绘制参数缓存
    this.drawCache = {
      centerX: 0,
      centerY: 0,
      outerRadius: 0,
      innerRadius: 0,
      segmentAngles: []
    }
  }

  /**
   * 初始化渲染器
   * @param {string} canvasId Canvas ID
   * @param {any} context 上下文（可能是组件实例等）
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async init(canvasId, context = null) {
    throw new Error('BaseRenderer.init() must be implemented by subclass')
  }

  /**
   * 绘制图表
   * @param {Array} data 图表数据
   * @param {Object} options 绘制选项
   */
  draw(data, options = {}) {
    throw new Error('BaseRenderer.draw() must be implemented by subclass')
  }

  /**
   * 清空画布
   */
  clear() {
    throw new Error('BaseRenderer.clear() must be implemented by subclass')
  }

  /**
   * 销毁渲染器，清理资源
   */
  destroy() {
    this.isInitialized = false
    this.ctx = null
    this.clearCache()
  }

  /**
   * 是否支持动画
   * @returns {boolean}
   */
  supportsAnimation() {
    return false // 默认不支持，子类覆盖
  }

  /**
   * 是否支持交互
   * @returns {boolean}
   */
  supportsInteraction() {
    return false // 默认不支持，子类覆盖
  }

  /**
   * 计算绘制参数
   * @param {number} width 画布宽度
   * @param {number} height 画布高度
   * @param {Object} options 选项
   */
  calculateDrawParams(width, height, options = {}) {
    const centerX = width / 2
    const centerY = height / 2
    const outerRadius = Math.min(centerX, centerY) - 70
    const innerRadius = outerRadius * (options.innerRadiusRatio || 0.6)
    
    this.drawCache = {
      ...this.drawCache,
      centerX,
      centerY,
      outerRadius,
      innerRadius
    }
    
    return this.drawCache
  }

  /**
   * 计算扇形角度信息
   * @param {Array} data 数据
   * @param {number} animationProgress 动画进度 0-1
   * @returns {Array} 扇形角度信息数组
   */
  calculateSegmentAngles(data, animationProgress = 1) {
    const total = data.reduce((sum, item) => sum + (item.value || item.amount || 0), 0)
    if (total <= 0) return []
    
    let currentAngle = -Math.PI / 2 // 从顶部开始
    const segments = []
    
    data.forEach((item) => {
      const value = item.value || item.amount || 0
      if (value <= 0) return
      
      const angle = (value / total) * 2 * Math.PI * animationProgress
      const endAngle = currentAngle + angle
      const midAngle = (currentAngle + endAngle) / 2
      
      segments.push({
        id: item.id,
        startAngle: currentAngle,
        endAngle: endAngle,
        midAngle: midAngle,
        data: item,
        percentage: (value / total) * 100
      })
      
      currentAngle = endAngle
    })
    
    this.drawCache.segmentAngles = segments
    return segments
  }

  /**
   * 检测点击的扇形
   * @param {number} touchX 触摸X坐标
   * @param {number} touchY 触摸Y坐标
   * @returns {Object|null} 点击的扇形数据
   */
  detectClickedSegment(touchX, touchY) {
    const { centerX, centerY, innerRadius, outerRadius, segmentAngles } = this.drawCache
    
    // 计算触摸点距离中心的距离
    const dx = touchX - centerX
    const dy = touchY - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // 检查是否在环形区域内
    if (distance < innerRadius || distance > outerRadius + 20) {
      return null
    }
    
    // 计算触摸角度
    let angle = Math.atan2(dy, dx) + Math.PI / 2
    if (angle < 0) angle += 2 * Math.PI
    
    // 查找对应的扇形
    for (const segment of segmentAngles) {
      let startAngle = segment.startAngle + Math.PI / 2
      let endAngle = segment.endAngle + Math.PI / 2
      
      if (startAngle < 0) startAngle += 2 * Math.PI
      if (endAngle < 0) endAngle += 2 * Math.PI
      
      // 处理跨越0度的情况
      if (endAngle < startAngle) {
        if (angle >= startAngle || angle <= endAngle) {
          return segment
        }
      } else {
        if (angle >= startAngle && angle <= endAngle) {
          return segment
        }
      }
    }
    
    return null
  }

  /**
   * 更新渲染状态
   * @param {Object} newState 新状态
   */
  updateRenderState(newState) {
    this.renderState = {
      ...this.renderState,
      ...newState,
      lastRenderTime: Date.now(),
      renderCount: this.renderState.renderCount + 1
    }
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.drawCache = {
      centerX: 0,
      centerY: 0,
      outerRadius: 0,
      innerRadius: 0,
      segmentAngles: []
    }
  }

  /**
   * 记录日志
   * @param {string} level 日志级别
   * @param {string} message 消息
   * @param {any} data 附加数据
   */
  log(level, message, data = null) {
    const prefix = `[${this.constructor.name}]`
    
    if (level === 'error') {
      console.error(prefix, message, data)
    } else if (level === 'warn') {
      console.warn(prefix, message, data)
    } else {
      console.log(prefix, message, data)
    }
  }

  /**
   * 格式化金额显示
   * @param {number} amount 金额
   * @returns {string}
   */
  formatAmount(amount) {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万'
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'k'
    }
    return amount.toFixed(0)
  }

  /**
   * 获取渲染器信息
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.constructor.name,
      isInitialized: this.isInitialized,
      supportsAnimation: this.supportsAnimation(),
      supportsInteraction: this.supportsInteraction(),
      capabilities: this.capabilities,
      renderState: { ...this.renderState }
    }
  }
}

/**
 * 渲染器接口定义
 * 用于TypeScript类型检查和文档说明
 */
export const IRenderer = {
  // 必须实现的方法
  requiredMethods: [
    'init',
    'draw', 
    'clear',
    'destroy'
  ],
  
  // 可选实现的方法
  optionalMethods: [
    'supportsAnimation',
    'supportsInteraction',
    'detectClickedSegment'
  ]
}

export default BaseRenderer