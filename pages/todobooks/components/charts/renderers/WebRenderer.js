/**
 * Web平台专用渲染器
 * 使用标准Canvas 2D API和requestAnimationFrame实现高性能渲染
 */

import BaseRenderer from './BaseRenderer.js'

export class WebRenderer extends BaseRenderer {
  constructor(capabilities) {
    super(capabilities)
    this.type = 'web'
    this.canvas = null
    this.dpr = window.devicePixelRatio || 1
    
    // 动画相关
    this.animationFrame = null
    this.animationStartTime = 0
    this.animationDuration = 800
    this.isAnimating = false
    
    // 防抖定时器
    this.drawTimer = null
    
    // 悬停状态
    this.hoveredSegmentId = null
  }

  /**
   * 初始化Web渲染器
   * @param {string} canvasId Canvas ID
   * @param {any} context Vue组件实例
   * @returns {Promise<boolean>}
   */
  async init(canvasId, context = null) {
    try {
      this.canvasId = canvasId
      this.log('info', 'Web渲染器初始化开始')
      
      // 等待DOM完全渲染
      await this.waitForCanvas()
      
      if (!this.canvas || !this.ctx) {
        throw new Error('Canvas元素或上下文创建失败')
      }
      
      // 设置Canvas高DPI支持
      this.setupHighDPI()
      
      this.isInitialized = true
      this.log('info', 'Web渲染器初始化成功', {
        canvasId,
        dpr: this.dpr,
        size: `${this.canvas.width}x${this.canvas.height}`
      })
      
      return true
      
    } catch (error) {
      this.log('error', 'Web渲染器初始化失败', error)
      return false
    }
  }

  /**
   * 等待Canvas元素可用
   */
  async waitForCanvas(maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
      // 尝试通过不同方式查找Canvas
      this.canvas = document.querySelector(`#${this.canvasId}`) || 
                   document.querySelector(`[canvas-id="${this.canvasId}"]`) ||
                   document.querySelector(`canvas[canvas-id="${this.canvasId}"]`)
      
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d')
        if (this.ctx) {
          this.log('info', `Canvas找到 (第${i + 1}次尝试)`)
          return
        }
      }
      
      // 等待DOM更新
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    throw new Error('Canvas元素未找到或无法创建2D上下文')
  }

  /**
   * 设置高DPI支持
   */
  setupHighDPI() {
    if (!this.canvas || !this.ctx) return
    
    const rect = this.canvas.getBoundingClientRect()
    const displayWidth = rect.width
    const displayHeight = rect.height
    
    // 设置实际分辨率
    this.canvas.width = displayWidth * this.dpr
    this.canvas.height = displayHeight * this.dpr
    
    // 缩放上下文以匹配设备像素比
    this.ctx.scale(this.dpr, this.dpr)
    
    // 设置CSS尺寸
    this.canvas.style.width = displayWidth + 'px'
    this.canvas.style.height = displayHeight + 'px'
    
    this.log('info', '高DPI设置完成', {
      displaySize: `${displayWidth}x${displayHeight}`,
      actualSize: `${this.canvas.width}x${this.canvas.height}`,
      dpr: this.dpr
    })
  }

  /**
   * 绘制饼图
   * @param {Array} data 图表数据
   * @param {Object} options 绘制选项
   */
  draw(data, options = {}) {
    if (!this.isInitialized || !this.ctx || !data.length) {
      this.log('warn', '渲染器未准备好或无数据')
      return
    }
    
    this.log('info', 'Web渲染开始', { dataLength: data.length, options })
    
    // 清除之前的防抖定时器
    if (this.drawTimer) {
      clearTimeout(this.drawTimer)
    }
    
    // 防抖处理
    this.drawTimer = setTimeout(() => {
      this.drawCore(data, options)
    }, 16) // ~60fps
  }

  /**
   * 核心绘制逻辑
   * @param {Array} data 图表数据
   * @param {Object} options 绘制选项
   */
  drawCore(data, options = {}) {
    try {
      // 更新渲染状态
      this.updateRenderState({ selectedSegmentId: options.selectedSegment })
      
      // 计算绘制参数
      const width = options.width || 300
      const height = options.height || 300
      const drawParams = this.calculateDrawParams(width, height, options)
      
      // 如果启用动画且是首次绘制
      if (options.withAnimation && !this.isAnimating && this.supportsAnimation()) {
        this.startAnimation(data, options)
      } else {
        this.drawStatic(data, options, drawParams, 1)
      }
      
    } catch (error) {
      this.log('error', '绘制过程出错', error)
    }
  }

  /**
   * 静态绘制（无动画）
   * @param {Array} data 数据
   * @param {Object} options 选项
   * @param {Object} drawParams 绘制参数
   * @param {number} progress 绘制进度 0-1
   */
  drawStatic(data, options, drawParams, progress = 1) {
    const { centerX, centerY, outerRadius, innerRadius } = drawParams
    
    // 清空画布
    this.clear()
    
    // 计算扇形角度
    const segments = this.calculateSegmentAngles(data, progress)
    
    if (segments.length === 0) {
      this.drawEmptyChart(drawParams)
      return
    }
    
    // 绘制扇形
    segments.forEach(segment => {
      this.drawSegment(segment, drawParams, options)
    })
    
    // 绘制中心圆
    this.drawCenterCircle(drawParams)
    
    // 绘制标签（如果需要且动画完成）
    if (options.showLabels && progress === 1) {
      segments.forEach(segment => {
        if (segment.data.showExtensionLabel && segment.percentage > 5) {
          this.drawLabel(segment, drawParams)
        }
      })
    }
    
    this.log('info', 'Web静态绘制完成', { segmentCount: segments.length, progress })
  }

  /**
   * 绘制单个扇形
   * @param {Object} segment 扇形数据
   * @param {Object} drawParams 绘制参数
   * @param {Object} options 选项
   */
  drawSegment(segment, drawParams, options) {
    const { centerX, centerY, outerRadius, innerRadius } = drawParams
    const { startAngle, endAngle, data } = segment
    
    // 判断是否选中或悬停
    const isSelected = this.renderState.selectedSegmentId === data.id
    const isHovered = this.hoveredSegmentId === data.id
    
    let currentOuterRadius = outerRadius
    if (isSelected) {
      currentOuterRadius += options.selectedOffset || 8
    } else if (isHovered) {
      currentOuterRadius += options.hoverOffset || 4
    }
    
    // 绘制扇形路径
    this.ctx.save()
    
    // 设置填充颜色
    this.ctx.fillStyle = data.color || '#ccc'
    this.ctx.beginPath()
    
    // 外圆弧
    this.ctx.arc(centerX, centerY, currentOuterRadius, startAngle, endAngle)
    // 内圆弧（反向）
    this.ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
    this.ctx.closePath()
    this.ctx.fill()
    
    // 绘制边框
    this.ctx.strokeStyle = '#ffffff'
    this.ctx.lineWidth = 2
    this.ctx.stroke()
    
    this.ctx.restore()
  }

  /**
   * 绘制中心空白圆
   * @param {Object} drawParams 绘制参数
   */
  drawCenterCircle(drawParams) {
    const { centerX, centerY, innerRadius } = drawParams
    
    this.ctx.save()
    this.ctx.fillStyle = '#ffffff'
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, innerRadius - 1, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.restore()
  }

  /**
   * 绘制标签
   * @param {Object} segment 扇形数据
   * @param {Object} drawParams 绘制参数
   */
  drawLabel(segment, drawParams) {
    const { centerX, centerY } = drawParams
    const { midAngle, data } = segment
    
    const labelDistance = 25
    const textDistance = 35
    const currentOuterRadius = drawParams.outerRadius + 
      (this.renderState.selectedSegmentId === data.id ? 8 : 0)
    
    // 计算标签线起点和终点
    const lineStartX = centerX + Math.cos(midAngle) * currentOuterRadius
    const lineStartY = centerY + Math.sin(midAngle) * currentOuterRadius
    const lineEndX = centerX + Math.cos(midAngle) * (currentOuterRadius + labelDistance)
    const lineEndY = centerY + Math.sin(midAngle) * (currentOuterRadius + labelDistance)
    
    // 绘制引导线
    this.ctx.save()
    this.ctx.strokeStyle = data.color || '#666'
    this.ctx.lineWidth = 1.5
    this.ctx.beginPath()
    this.ctx.moveTo(lineStartX, lineStartY)
    this.ctx.lineTo(lineEndX, lineEndY)
    this.ctx.stroke()
    
    // 绘制文本
    const textX = centerX + Math.cos(midAngle) * (currentOuterRadius + textDistance)
    const textY = centerY + Math.sin(midAngle) * (currentOuterRadius + textDistance)
    
    // 处理文本显示
    let displayText = data.tagName || data.label || data.id
    if (displayText.length > 6) {
      displayText = displayText.substring(0, 5) + '...'
    }
    
    // 根据角度调整文本对齐
    const isRightSide = Math.cos(midAngle) >= 0
    this.ctx.textAlign = isRightSide ? 'left' : 'right'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillStyle = '#333333'
    this.ctx.font = '11px Arial'
    this.ctx.fillText(displayText, textX, textY)
    
    this.ctx.restore()
  }

  /**
   * 绘制空图表
   * @param {Object} drawParams 绘制参数
   */
  drawEmptyChart(drawParams) {
    const { centerX, centerY, outerRadius, innerRadius } = drawParams
    
    this.ctx.save()
    this.ctx.fillStyle = '#f0f0f0'
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI)
    this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, true)
    this.ctx.fill()
    this.ctx.restore()
  }

  /**
   * 开始动画
   * @param {Array} data 数据
   * @param {Object} options 选项
   */
  startAnimation(data, options) {
    if (!this.supportsAnimation()) return
    
    this.isAnimating = true
    this.animationStartTime = performance.now()
    
    const drawParams = this.calculateDrawParams(options.width || 300, options.height || 300, options)
    
    const animate = (currentTime) => {
      const elapsed = currentTime - this.animationStartTime
      const progress = Math.min(elapsed / this.animationDuration, 1)
      
      // 缓动函数
      const easedProgress = this.easeOutCubic(progress)
      
      // 绘制当前帧
      this.drawStatic(data, options, drawParams, easedProgress)
      
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate)
      } else {
        this.isAnimating = false
        this.animationFrame = null
        this.log('info', 'Web动画完成')
      }
    }
    
    this.animationFrame = requestAnimationFrame(animate)
    this.log('info', 'Web动画开始')
  }

  /**
   * 缓动函数
   * @param {number} t 进度 0-1
   * @returns {number} 缓动后的进度
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
  }

  /**
   * 清空画布
   */
  clear() {
    if (!this.ctx || !this.canvas) return
    
    this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr)
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    // 停止动画
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
    
    // 清理定时器
    if (this.drawTimer) {
      clearTimeout(this.drawTimer)
      this.drawTimer = null
    }
    
    // 清理引用
    this.canvas = null
    this.ctx = null
    this.hoveredSegmentId = null
    
    // 调用父类销毁
    super.destroy()
    
    this.log('info', 'Web渲染器已销毁')
  }

  /**
   * 是否支持动画
   * @returns {boolean}
   */
  supportsAnimation() {
    return this.capabilities.animation?.hasRAF && this.capabilities.performance?.shouldEnableAnimation
  }

  /**
   * 是否支持交互
   * @returns {boolean}
   */
  supportsInteraction() {
    return this.capabilities.touch?.hasTouchEvents || this.capabilities.touch?.hasMouseEvents
  }

  /**
   * 检测点击的扇形（Web特化版本）
   * @param {number} touchX 触摸X坐标
   * @param {number} touchY 触摸Y坐标
   * @returns {Object|null} 点击的扇形数据
   */
  detectClickedSegment(touchX, touchY) {
    // 调用基类方法
    const segment = super.detectClickedSegment(touchX, touchY)
    
    if (segment) {
      this.log('info', 'Web点击检测成功', { 
        segment: segment.data.tagName || segment.data.id,
        coordinates: { touchX, touchY }
      })
    }
    
    return segment
  }

  /**
   * 设置悬停状态
   * @param {string|null} segmentId 扇形ID
   */
  setHoveredSegment(segmentId) {
    if (this.hoveredSegmentId !== segmentId) {
      this.hoveredSegmentId = segmentId
      // 触发重绘以显示悬停效果
      // 这里需要保存最后的绘制参数以便重绘
      this.log('info', 'Web悬停状态更新', { segmentId })
    }
  }

  /**
   * 获取Canvas元素信息
   * @returns {Object}
   */
  getCanvasInfo() {
    if (!this.canvas) return null
    
    return {
      width: this.canvas.width,
      height: this.canvas.height,
      displayWidth: this.canvas.offsetWidth,
      displayHeight: this.canvas.offsetHeight,
      dpr: this.dpr,
      isHighDPI: this.dpr > 1
    }
  }
}

export default WebRenderer