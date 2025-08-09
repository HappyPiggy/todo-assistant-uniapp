/**
 * 微信小程序专用渲染器
 * 使用微信小程序Canvas API和setTimeout动画
 */

import BaseRenderer from './BaseRenderer.js'

export class WeixinRenderer extends BaseRenderer {
  constructor(capabilities) {
    super(capabilities)
    this.type = 'weixin'
    this.componentInstance = null
    this.canvasWidth = 300
    this.canvasHeight = 300
    
    // 动画相关
    this.animationTimer = null
    this.animationStartTime = 0
    this.animationDuration = 600 // 微信小程序动画稍短
    this.isAnimating = false
    
    // 防抖定时器
    this.drawTimer = null
    
    // 小程序特有的延迟处理
    this.initRetries = 0
    this.maxInitRetries = 5
  }

  /**
   * 初始化微信小程序渲染器
   * @param {string} canvasId Canvas ID
   * @param {any} context Vue组件实例
   * @returns {Promise<boolean>}
   */
  async init(canvasId, context = null) {
    try {
      this.canvasId = canvasId
      this.componentInstance = context
      this.log('info', '微信小程序渲染器初始化开始')
      
      // 微信小程序需要等待组件完全挂载
      await this.waitForComponentReady()
      
      // 创建Canvas上下文
      this.ctx = uni.createCanvasContext(canvasId, this.componentInstance)
      
      if (!this.ctx) {
        throw new Error('无法创建微信小程序Canvas上下文')
      }
      
      // 微信小程序Canvas需要额外的初始化时间
      await this.delay(200)
      
      this.isInitialized = true
      this.log('info', '微信小程序渲染器初始化成功', {
        canvasId,
        hasContext: !!this.ctx
      })
      
      return true
      
    } catch (error) {
      this.log('error', '微信小程序渲染器初始化失败', error)
      
      // 重试机制
      if (this.initRetries < this.maxInitRetries) {
        this.initRetries++
        const retryDelay = this.initRetries * 300
        this.log('info', `${retryDelay}ms后重试初始化 (第${this.initRetries}次)`)
        
        await this.delay(retryDelay)
        return this.init(canvasId, context)
      }
      
      return false
    }
  }

  /**
   * 等待组件准备就绪
   */
  async waitForComponentReady() {
    // 微信小程序需要等待组件完全渲染
    await this.delay(100)
    
    // 检查组件实例是否可用
    if (!this.componentInstance) {
      this.log('warn', '组件实例不可用，将使用全局上下文')
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
    
    this.log('info', '微信小程序渲染开始', { dataLength: data.length, options })
    
    // 更新Canvas尺寸
    this.canvasWidth = options.width || 300
    this.canvasHeight = options.height || 300
    
    // 清除之前的防抖定时器
    if (this.drawTimer) {
      clearTimeout(this.drawTimer)
    }
    
    // 防抖处理（微信小程序使用较长的防抖时间）
    this.drawTimer = setTimeout(() => {
      this.drawCore(data, options)
    }, 50)
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
      
      // 微信小程序动画支持较弱，简化动画逻辑
      if (options.withAnimation && !this.isAnimating && this.supportsAnimation()) {
        this.startAnimation(data, options, drawParams)
      } else {
        this.drawStatic(data, options, drawParams, 1)
      }
      
    } catch (error) {
      this.log('error', '微信小程序绘制过程出错', error)
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
    
    // 绘制标签（微信小程序标签绘制可能有限制，简化处理）
    if (options.showLabels && progress === 1) {
      segments.forEach(segment => {
        if (segment.data.showExtensionLabel && segment.percentage > 8) { // 阈值提高到8%
          this.drawLabel(segment, drawParams)
        }
      })
    }
    
    // 微信小程序必须调用draw()来实际绘制
    this.ctx.draw()
    
    this.log('info', '微信小程序静态绘制完成', { segmentCount: segments.length, progress })
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
      currentOuterRadius += options.selectedOffset || 6 // 微信小程序减小偏移量
    }
    
    // 设置填充颜色
    this.ctx.setFillStyle(data.color || '#cccccc')
    
    // 绘制扇形路径
    this.ctx.beginPath()
    // 移动到中心点
    this.ctx.moveTo(centerX, centerY)
    // 外圆弧
    this.ctx.arc(centerX, centerY, currentOuterRadius, startAngle, endAngle)
    // 连接到内圆起点
    const innerStartX = centerX + Math.cos(endAngle) * innerRadius
    const innerStartY = centerY + Math.sin(endAngle) * innerRadius
    this.ctx.lineTo(innerStartX, innerStartY)
    // 内圆弧（反向）
    this.ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
    this.ctx.closePath()
    this.ctx.fill()
    
    // 绘制边框
    this.ctx.setStrokeStyle('#ffffff')
    this.ctx.setLineWidth(1.5) // 微信小程序线条稍细
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
   * 绘制标签
   * @param {Object} segment 扇形数据
   * @param {Object} drawParams 绘制参数
   */
  drawLabel(segment, drawParams) {
    const { centerX, centerY } = drawParams
    const { midAngle, data } = segment
    
    const labelDistance = 20 // 微信小程序标签距离稍近
    const textDistance = 28
    const currentOuterRadius = drawParams.outerRadius + 
      (this.renderState.selectedSegmentId === data.id ? 6 : 0)
    
    // 计算标签线起点和终点
    const lineStartX = centerX + Math.cos(midAngle) * currentOuterRadius
    const lineStartY = centerY + Math.sin(midAngle) * currentOuterRadius
    const lineEndX = centerX + Math.cos(midAngle) * (currentOuterRadius + labelDistance)
    const lineEndY = centerY + Math.sin(midAngle) * (currentOuterRadius + labelDistance)
    
    // 绘制引导线
    this.ctx.setStrokeStyle(data.color || '#666666')
    this.ctx.setLineWidth(1)
    this.ctx.beginPath()
    this.ctx.moveTo(lineStartX, lineStartY)
    this.ctx.lineTo(lineEndX, lineEndY)
    this.ctx.stroke()
    
    // 绘制文本
    const textX = centerX + Math.cos(midAngle) * (currentOuterRadius + textDistance)
    const textY = centerY + Math.sin(midAngle) * (currentOuterRadius + textDistance)
    
    // 处理文本显示
    let displayText = data.tagName || data.label || data.id
    if (displayText.length > 5) { // 微信小程序文本限制更严格
      displayText = displayText.substring(0, 4) + '...'
    }
    
    // 根据角度调整文本对齐
    const isRightSide = Math.cos(midAngle) >= 0
    this.ctx.setTextAlign(isRightSide ? 'left' : 'right')
    this.ctx.setTextBaseline('middle')
    this.ctx.setFillStyle('#333333')
    this.ctx.setFontSize(10) // 微信小程序字体稍小
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
      
      // 简单的线性缓动（微信小程序性能考虑）
      const easedProgress = progress
      
      // 绘制当前帧
      this.drawStatic(data, options, drawParams, easedProgress)
      
      if (progress < 1) {
        this.animationTimer = setTimeout(animate, 33) // ~30fps for better performance
      } else {
        this.isAnimating = false
        this.animationTimer = null
        this.log('info', '微信小程序动画完成')
      }
    }
    
    this.animationTimer = setTimeout(animate, 16)
    this.log('info', '微信小程序动画开始')
  }

  /**
   * 清空画布
   */
  clear() {
    if (!this.ctx) return
    
    // 微信小程序清空画布
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
    this.componentInstance = null
    
    // 调用父类销毁
    super.destroy()
    
    this.log('info', '微信小程序渲染器已销毁')
  }

  /**
   * 是否支持动画
   * @returns {boolean}
   */
  supportsAnimation() {
    // 微信小程序支持基于setTimeout的动画
    return this.capabilities.performance?.shouldEnableAnimation !== false
  }

  /**
   * 是否支持交互
   * @returns {boolean}
   */
  supportsInteraction() {
    return true // 微信小程序支持触摸交互
  }

  /**
   * 检测点击的扇形（微信小程序特化版本）
   * @param {number} touchX 触摸X坐标
   * @param {number} touchY 触摸Y坐标
   * @returns {Object|null} 点击的扇形数据
   */
  detectClickedSegment(touchX, touchY) {
    // 微信小程序的坐标可能需要调整
    const adjustedX = touchX
    const adjustedY = touchY
    
    // 调用基类方法
    const segment = super.detectClickedSegment(adjustedX, adjustedY)
    
    if (segment) {
      this.log('info', '微信小程序点击检测成功', { 
        segment: segment.data.tagName || segment.data.id,
        coordinates: { touchX: adjustedX, touchY: adjustedY }
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
      type: 'weixin-miniprogram',
      hasContext: !!this.ctx,
      isInitialized: this.isInitialized
    }
  }

  /**
   * 微信小程序特有的Canvas刷新
   */
  forceRefresh() {
    if (this.ctx) {
      // 微信小程序有时需要强制刷新
      try {
        this.ctx.draw(true) // 保留之前的绘制内容
      } catch (error) {
        this.log('warn', '强制刷新失败', error)
      }
    }
  }
}

export default WeixinRenderer