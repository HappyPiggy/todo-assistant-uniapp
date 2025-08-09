/**
 * App平台专用渲染器
 * 兼容Android和iOS，具有性能检测和自动降级功能
 */

import BaseRenderer from './BaseRenderer.js'

export class AppRenderer extends BaseRenderer {
  constructor(capabilities) {
    super(capabilities)
    this.type = 'app'
    this.canvasWidth = 300
    this.canvasHeight = 300
    
    // 平台信息
    this.isAndroid = capabilities.platform?.isAndroid || false
    this.isiOS = capabilities.platform?.isiOS || false
    this.performanceLevel = capabilities.performance?.level || 'medium'
    
    // 动画相关
    this.animationTimer = null
    this.animationStartTime = 0
    this.animationDuration = this.getAnimationDuration()
    this.isAnimating = false
    
    // 防抖定时器
    this.drawTimer = null
    
    // App特有的初始化状态
    this.initRetries = 0
    this.maxInitRetries = 3
    this.needsUpdate = false // 某些App版本需要调用update()
  }

  /**
   * 初始化App渲染器
   * @param {string} canvasId Canvas ID
   * @param {any} context Vue组件实例
   * @returns {Promise<boolean>}
   */
  async init(canvasId, context = null) {
    try {
      this.canvasId = canvasId
      this.log('info', 'App渲染器初始化开始', {
        platform: this.isAndroid ? 'Android' : this.isiOS ? 'iOS' : 'Unknown',
        performanceLevel: this.performanceLevel
      })
      
      // App平台需要等待更长时间
      await this.waitForAppReady()
      
      // 创建Canvas上下文
      this.ctx = uni.createCanvasContext(canvasId)
      
      if (!this.ctx) {
        throw new Error('无法创建App Canvas上下文')
      }
      
      // 检测是否需要特殊处理
      this.detectAppSpecificFeatures()
      
      // App平台需要额外的初始化时间
      await this.delay(this.isAndroid ? 300 : 200)
      
      this.isInitialized = true
      this.log('info', 'App渲染器初始化成功', {
        canvasId,
        hasContext: !!this.ctx,
        needsUpdate: this.needsUpdate
      })
      
      return true
      
    } catch (error) {
      this.log('error', 'App渲染器初始化失败', error)
      
      // 重试机制
      if (this.initRetries < this.maxInitRetries) {
        this.initRetries++
        const retryDelay = this.initRetries * (this.isAndroid ? 500 : 300)
        this.log('info', `${retryDelay}ms后重试初始化 (第${this.initRetries}次)`)
        
        await this.delay(retryDelay)
        return this.init(canvasId, context)
      }
      
      return false
    }
  }

  /**
   * 等待App准备就绪
   */
  async waitForAppReady() {
    // Android需要更长的等待时间
    const waitTime = this.isAndroid ? 200 : 100
    await this.delay(waitTime)
    
    // 低性能设备需要更长时间
    if (this.performanceLevel === 'low') {
      await this.delay(200)
    }
  }

  /**
   * 检测App特有功能
   */
  detectAppSpecificFeatures() {
    // 某些App版本需要调用update()方法
    try {
      if (typeof this.ctx.update === 'function') {
        this.needsUpdate = true
        this.log('info', 'Canvas支持update()方法')
      }
    } catch (error) {
      // ignore
    }
  }

  /**
   * 获取动画持续时间
   * @returns {number} 毫秒
   */
  getAnimationDuration() {
    switch (this.performanceLevel) {
      case 'high': return 600
      case 'medium': return 400
      case 'low': return 200
      default: return 400
    }
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
    
    this.log('info', 'App渲染开始', { 
      dataLength: data.length, 
      platform: this.isAndroid ? 'Android' : 'iOS',
      performanceLevel: this.performanceLevel
    })
    
    // 更新Canvas尺寸
    this.canvasWidth = options.width || 300
    this.canvasHeight = options.height || 300
    
    // 清除之前的防抖定时器
    if (this.drawTimer) {
      clearTimeout(this.drawTimer)
    }
    
    // App平台使用更长的防抖时间（特别是Android）
    const debounceTime = this.isAndroid ? 80 : 50
    this.drawTimer = setTimeout(() => {
      this.drawCore(data, options)
    }, debounceTime)
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
      const drawParams = this.calculateDrawParams(this.canvasWidth, this.canvasHeight, options)
      
      // 根据性能级别决定是否使用动画
      if (options.withAnimation && !this.isAnimating && this.supportsAnimation()) {
        this.startAnimation(data, options, drawParams)
      } else {
        this.drawStatic(data, options, drawParams, 1)
      }
      
    } catch (error) {
      this.log('error', 'App绘制过程出错', error)
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
      this.finalizeDraw()
      return
    }
    
    // 批量绘制扇形（提高性能）
    this.batchDrawSegments(segments, drawParams, options)
    
    // 绘制中心圆
    this.drawCenterCircle(drawParams)
    
    // 绘制标签（根据性能级别决定）
    if (options.showLabels && progress === 1 && this.shouldDrawLabels()) {
      segments.forEach(segment => {
        if (segment.data.showExtensionLabel && segment.percentage > 10) { // App端阈值更高
          this.drawLabel(segment, drawParams)
        }
      })
    }
    
    // 完成绘制
    this.finalizeDraw()
    
    this.log('info', 'App静态绘制完成', { 
      segmentCount: segments.length, 
      progress,
      platform: this.isAndroid ? 'Android' : 'iOS'
    })
  }

  /**
   * 批量绘制扇形
   * @param {Array} segments 扇形数组
   * @param {Object} drawParams 绘制参数
   * @param {Object} options 选项
   */
  batchDrawSegments(segments, drawParams, options) {
    segments.forEach(segment => {
      this.drawSegment(segment, drawParams, options)
    })
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
    
    // 判断是否选中
    const isSelected = this.renderState.selectedSegmentId === data.id
    let currentOuterRadius = outerRadius
    if (isSelected) {
      const offset = this.isAndroid ? 4 : 6 // Android减小偏移量
      currentOuterRadius += options.selectedOffset || offset
    }
    
    // 设置填充颜色
    this.ctx.setFillStyle(data.color || '#cccccc')
    
    // 绘制扇形路径
    this.ctx.beginPath()
    this.ctx.moveTo(centerX, centerY)
    // 外圆弧
    this.ctx.arc(centerX, centerY, currentOuterRadius, startAngle, endAngle)
    // 连接到内圆
    const innerEndX = centerX + Math.cos(endAngle) * innerRadius
    const innerEndY = centerY + Math.sin(endAngle) * innerRadius
    this.ctx.lineTo(innerEndX, innerEndY)
    // 内圆弧（反向）
    this.ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
    this.ctx.closePath()
    this.ctx.fill()
    
    // 绘制边框（根据平台调整）
    this.ctx.setStrokeStyle('#ffffff')
    this.ctx.setLineWidth(this.isAndroid ? 1 : 1.5)
    this.ctx.stroke()
  }

  /**
   * 绘制中心空白圆
   * @param {Object} drawParams 绘制参数
   */
  drawCenterCircle(drawParams) {
    const { centerX, centerY, innerRadius } = drawParams
    
    this.ctx.setFillStyle('#ffffff')
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, innerRadius - 1, 0, 2 * Math.PI)
    this.ctx.fill()
  }

  /**
   * 是否应该绘制标签
   * @returns {boolean}
   */
  shouldDrawLabels() {
    // 低性能设备不绘制标签
    return this.performanceLevel !== 'low'
  }

  /**
   * 绘制标签
   * @param {Object} segment 扇形数据
   * @param {Object} drawParams 绘制参数
   */
  drawLabel(segment, drawParams) {
    const { centerX, centerY } = drawParams
    const { midAngle, data } = segment
    
    const labelDistance = this.isAndroid ? 15 : 18
    const textDistance = this.isAndroid ? 25 : 28
    const currentOuterRadius = drawParams.outerRadius + 
      (this.renderState.selectedSegmentId === data.id ? 4 : 0)
    
    // 计算标签线起点和终点
    const lineStartX = centerX + Math.cos(midAngle) * currentOuterRadius
    const lineStartY = centerY + Math.sin(midAngle) * currentOuterRadius
    const lineEndX = centerX + Math.cos(midAngle) * (currentOuterRadius + labelDistance)
    const lineEndY = centerY + Math.sin(midAngle) * (currentOuterRadius + labelDistance)
    
    // 绘制引导线
    this.ctx.setStrokeStyle(data.color || '#666666')
    this.ctx.setLineWidth(0.8)
    this.ctx.beginPath()
    this.ctx.moveTo(lineStartX, lineStartY)
    this.ctx.lineTo(lineEndX, lineEndY)
    this.ctx.stroke()
    
    // 绘制文本
    const textX = centerX + Math.cos(midAngle) * (currentOuterRadius + textDistance)
    const textY = centerY + Math.sin(midAngle) * (currentOuterRadius + textDistance)
    
    // 处理文本显示
    let displayText = data.tagName || data.label || data.id
    const maxLength = this.isAndroid ? 4 : 5
    if (displayText.length > maxLength) {
      displayText = displayText.substring(0, maxLength - 1) + '...'
    }
    
    // 根据角度调整文本对齐
    const isRightSide = Math.cos(midAngle) >= 0
    this.ctx.setTextAlign(isRightSide ? 'left' : 'right')
    this.ctx.setTextBaseline('middle')
    this.ctx.setFillStyle('#333333')
    this.ctx.setFontSize(this.isAndroid ? 9 : 10)
    this.ctx.fillText(displayText, textX, textY)
  }

  /**
   * 绘制空图表
   * @param {Object} drawParams 绘制参数
   */
  drawEmptyChart(drawParams) {
    const { centerX, centerY, outerRadius, innerRadius } = drawParams
    
    this.ctx.setFillStyle('#f0f0f0')
    this.ctx.beginPath()
    this.ctx.moveTo(centerX, centerY)
    this.ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI)
    this.ctx.moveTo(centerX + innerRadius, centerY)
    this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, true)
    this.ctx.fill()
  }

  /**
   * 开始动画
   * @param {Array} data 数据
   * @param {Object} options 选项
   * @param {Object} drawParams 绘制参数
   */
  startAnimation(data, options, drawParams) {
    if (!this.supportsAnimation()) return
    
    this.isAnimating = true
    this.animationStartTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - this.animationStartTime
      const progress = Math.min(elapsed / this.animationDuration, 1)
      
      // 简化的缓动函数（App性能考虑）
      const easedProgress = this.performanceLevel === 'high' 
        ? this.easeOutQuad(progress)
        : progress
      
      // 绘制当前帧
      this.drawStatic(data, options, drawParams, easedProgress)
      
      if (progress < 1) {
        // 根据性能调整帧率
        const frameDelay = this.performanceLevel === 'high' ? 16 : 
                          this.performanceLevel === 'medium' ? 25 : 40
        this.animationTimer = setTimeout(animate, frameDelay)
      } else {
        this.isAnimating = false
        this.animationTimer = null
        this.log('info', 'App动画完成')
      }
    }
    
    this.animationTimer = setTimeout(animate, 16)
    this.log('info', 'App动画开始')
  }

  /**
   * 二次缓动函数
   * @param {number} t 进度 0-1
   * @returns {number} 缓动后的进度
   */
  easeOutQuad(t) {
    return t * (2 - t)
  }

  /**
   * 完成绘制
   */
  finalizeDraw() {
    // App平台必须调用draw()
    this.ctx.draw()
    
    // 某些版本需要调用update()
    if (this.needsUpdate) {
      setTimeout(() => {
        try {
          if (this.ctx && this.ctx.update) {
            this.ctx.update()
          }
        } catch (error) {
          this.log('warn', 'Canvas update失败', error)
        }
      }, 50)
    }
  }

  /**
   * 清空画布
   */
  clear() {
    if (!this.ctx) return
    
    // App平台清空画布
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    // 停止动画
    if (this.animationTimer) {
      clearTimeout(this.animationTimer)
      this.animationTimer = null
    }
    
    // 清理定时器
    if (this.drawTimer) {
      clearTimeout(this.drawTimer)
      this.drawTimer = null
    }
    
    // 清理引用
    this.ctx = null
    
    // 调用父类销毁
    super.destroy()
    
    this.log('info', 'App渲染器已销毁')
  }

  /**
   * 是否支持动画
   * @returns {boolean}
   */
  supportsAnimation() {
    // 根据性能级别决定
    return this.capabilities.performance?.shouldEnableAnimation &&
           this.performanceLevel !== 'low'
  }

  /**
   * 是否支持交互
   * @returns {boolean}
   */
  supportsInteraction() {
    return true
  }

  /**
   * 检测点击的扇形（App特化版本）
   * @param {number} touchX 触摸X坐标
   * @param {number} touchY 触摸Y坐标
   * @returns {Object|null} 点击的扇形数据
   */
  detectClickedSegment(touchX, touchY) {
    // App端可能需要坐标调整
    const adjustedX = touchX
    const adjustedY = touchY
    
    // 调用基类方法，但扩大检测范围
    const originalOuterRadius = this.drawCache.outerRadius
    this.drawCache.outerRadius = originalOuterRadius + (this.isAndroid ? 15 : 10)
    
    const segment = super.detectClickedSegment(adjustedX, adjustedY)
    
    // 恢复原始半径
    this.drawCache.outerRadius = originalOuterRadius
    
    if (segment) {
      this.log('info', 'App点击检测成功', { 
        segment: segment.data.tagName || segment.data.id,
        coordinates: { touchX: adjustedX, touchY: adjustedY },
        platform: this.isAndroid ? 'Android' : 'iOS'
      })
    }
    
    return segment
  }

  /**
   * 延迟辅助函数
   * @param {number} ms 延迟毫秒数
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取Canvas信息
   * @returns {Object}
   */
  getCanvasInfo() {
    return {
      width: this.canvasWidth,
      height: this.canvasHeight,
      type: 'app',
      platform: this.isAndroid ? 'android' : this.isiOS ? 'ios' : 'unknown',
      performanceLevel: this.performanceLevel,
      hasContext: !!this.ctx,
      isInitialized: this.isInitialized,
      needsUpdate: this.needsUpdate
    }
  }

  /**
   * 强制刷新（App特有）
   */
  forceRefresh() {
    if (this.ctx) {
      try {
        this.ctx.draw(true)
        if (this.needsUpdate) {
          setTimeout(() => {
            if (this.ctx && this.ctx.update) {
              this.ctx.update()
            }
          }, 100)
        }
      } catch (error) {
        this.log('warn', 'App强制刷新失败', error)
      }
    }
  }
}

export default AppRenderer