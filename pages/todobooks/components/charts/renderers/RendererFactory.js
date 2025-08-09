/**
 * 渲染器工厂
 * 根据平台能力自动选择最合适的渲染器
 */

import BaseRenderer from './BaseRenderer.js'

/**
 * 创建渲染器实例
 * @param {Object} capabilities 平台能力检测结果
 * @returns {BaseRenderer} 渲染器实例
 */
export function createRenderer(capabilities) {
  const { platform, canvas, performance } = capabilities
  
  console.log('RendererFactory: 选择渲染器', {
    platform: platform.type,
    canUseCanvas: canvas.canCreateContext,
    performanceLevel: performance.level,
    recommendedRenderer: capabilities.recommendedRenderer
  })
  
  // 如果Canvas不可用，使用CSS降级方案
  if (!canvas.canCreateContext) {
    console.log('Canvas不可用，使用CSS渲染器')
    return createCSSRenderer(capabilities)
  }
  
  // 根据平台类型选择渲染器
  switch (platform.type) {
    case 'web':
      return createWebRenderer(capabilities)
    
    case 'miniprogram':
      if (platform.name === 'WeChat') {
        return createWeixinRenderer(capabilities)
      }
      // 其他小程序使用通用小程序渲染器
      return createMiniProgramRenderer(capabilities)
    
    case 'app':
      return createAppRenderer(capabilities)
    
    default:
      console.warn('未知平台类型，使用降级渲染器')
      return createFallbackRenderer(capabilities)
  }
}

/**
 * 创建Web渲染器
 */
function createWebRenderer(capabilities) {
  // #ifdef H5
  try {
    // 导入专用的Web渲染器
    const WebRenderer = require('./WebRenderer.js').default || require('./WebRenderer.js').WebRenderer
    return new WebRenderer(capabilities)
  } catch (error) {
    console.error('导入Web渲染器失败，使用内联实现:', error)
    
    // 降级到内联实现
    class WebRendererFallback extends BaseRenderer {
      constructor(capabilities) {
        super(capabilities)
        this.type = 'web-fallback'
      }

      async init(canvasId, context = null) {
        try {
          this.canvasId = canvasId
          
          // 等待Canvas元素可用
          let retries = 10
          while (retries > 0) {
            const canvas = document.querySelector(`#${canvasId}`) || 
                          document.querySelector(`[canvas-id="${canvasId}"]`)
            
            if (canvas) {
              this.ctx = canvas.getContext('2d')
              if (this.ctx) {
                this.isInitialized = true
                this.log('info', 'Web降级渲染器初始化成功')
                return true
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 100))
            retries--
          }
          
          throw new Error('Canvas元素未找到或无法创建2D上下文')
          
        } catch (error) {
          this.log('error', 'Web降级渲染器初始化失败', error)
          return false
        }
      }

      draw(data, options = {}) {
        if (!this.isInitialized || !this.ctx) {
          this.log('warn', '渲染器未初始化')
          return
        }
        
        this.log('info', '开始Web降级渲染', { dataLength: data.length })
        
        // 简单的饼图绘制实现
        try {
          const width = options.width || 300
          const height = options.height || 300
          const centerX = width / 2
          const centerY = height / 2
          const outerRadius = Math.min(centerX, centerY) - 50
          const innerRadius = outerRadius * 0.6
          
          // 清空画布
          this.clear()
          
          if (data.length === 0) {
            // 绘制空状态
            this.ctx.fillStyle = '#f0f0f0'
            this.ctx.beginPath()
            this.ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI)
            this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, true)
            this.ctx.fill()
            return
          }
          
          // 计算总值
          const total = data.reduce((sum, item) => sum + (item.value || item.amount || 0), 0)
          if (total <= 0) return
          
          // 绘制扇形
          let currentAngle = -Math.PI / 2
          data.forEach((item) => {
            const value = item.value || item.amount || 0
            if (value <= 0) return
            
            const angle = (value / total) * 2 * Math.PI
            const endAngle = currentAngle + angle
            
            this.ctx.fillStyle = item.color || '#ccc'
            this.ctx.beginPath()
            this.ctx.arc(centerX, centerY, outerRadius, currentAngle, endAngle)
            this.ctx.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true)
            this.ctx.closePath()
            this.ctx.fill()
            
            // 绘制边框
            this.ctx.strokeStyle = '#ffffff'
            this.ctx.lineWidth = 2
            this.ctx.stroke()
            
            currentAngle = endAngle
          })
          
          // 绘制中心圆
          this.ctx.fillStyle = '#ffffff'
          this.ctx.beginPath()
          this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
          this.ctx.fill()
          
        } catch (error) {
          this.log('error', 'Web降级渲染失败', error)
        }
      }

      clear() {
        if (this.ctx) {
          const canvas = this.ctx.canvas
          this.ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }

      supportsAnimation() {
        return false // 降级实现不支持动画
      }

      supportsInteraction() {
        return this.capabilities.touch?.hasTouchEvents || this.capabilities.touch?.hasMouseEvents
      }
    }
    
    return new WebRendererFallback(capabilities)
  }
  // #endif
  
  // #ifndef H5
  return createFallbackRenderer(capabilities)
  // #endif
}

/**
 * 创建微信小程序渲染器
 */
function createWeixinRenderer(capabilities) {
  // #ifdef MP-WEIXIN
  try {
    // 导入专用的微信小程序渲染器
    const { WeixinRenderer } = require('./WeixinRenderer.js')
    return new WeixinRenderer(capabilities)
  } catch (error) {
    console.error('导入微信渲染器失败，使用内联实现:', error)
    
    // 降级到内联实现
    class WeixinRendererFallback extends BaseRenderer {
      constructor(capabilities) {
        super(capabilities)
        this.type = 'weixin-fallback'
      }

      async init(canvasId, context = null) {
        try {
          this.canvasId = canvasId
          this.componentContext = context
          
          // 等待组件渲染完成
          await new Promise(resolve => setTimeout(resolve, 200))
          
          this.ctx = uni.createCanvasContext(canvasId, context)
          
          if (!this.ctx) {
            throw new Error('无法创建微信Canvas上下文')
          }
          
          this.isInitialized = true
          this.log('info', '微信降级渲染器初始化成功')
          return true
          
        } catch (error) {
          this.log('error', '微信降级渲染器初始化失败', error)
          return false
        }
      }

      draw(data, options = {}) {
        if (!this.isInitialized || !this.ctx) {
          this.log('warn', '渲染器未初始化')
          return
        }
        
        this.log('info', '开始微信降级渲染', { dataLength: data.length })
        
        // 简单的饼图绘制实现
        try {
          const width = options.width || 300
          const height = options.height || 300
          const centerX = width / 2
          const centerY = height / 2
          const outerRadius = Math.min(centerX, centerY) - 40
          const innerRadius = outerRadius * 0.6
          
          // 清空画布
          this.clear()
          
          if (data.length === 0) {
            // 绘制空状态
            this.ctx.setFillStyle('#f0f0f0')
            this.ctx.beginPath()
            this.ctx.moveTo(centerX, centerY)
            this.ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI)
            this.ctx.moveTo(centerX + innerRadius, centerY)
            this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, true)
            this.ctx.fill()
            this.ctx.draw()
            return
          }
          
          // 计算总值
          const total = data.reduce((sum, item) => sum + (item.value || item.amount || 0), 0)
          if (total <= 0) return
          
          // 绘制扇形
          let currentAngle = -Math.PI / 2
          data.forEach((item) => {
            const value = item.value || item.amount || 0
            if (value <= 0) return
            
            const angle = (value / total) * 2 * Math.PI
            const endAngle = currentAngle + angle
            
            this.ctx.setFillStyle(item.color || '#ccc')
            this.ctx.beginPath()
            this.ctx.moveTo(centerX, centerY)
            this.ctx.arc(centerX, centerY, outerRadius, currentAngle, endAngle)
            this.ctx.lineTo(centerX + Math.cos(endAngle) * innerRadius, centerY + Math.sin(endAngle) * innerRadius)
            this.ctx.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true)
            this.ctx.closePath()
            this.ctx.fill()
            
            // 绘制边框
            this.ctx.setStrokeStyle('#ffffff')
            this.ctx.setLineWidth(1.5)
            this.ctx.stroke()
            
            currentAngle = endAngle
          })
          
          // 绘制中心圆
          this.ctx.setFillStyle('#ffffff')
          this.ctx.beginPath()
          this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
          this.ctx.fill()
          
          this.ctx.draw()
          
        } catch (error) {
          this.log('error', '微信降级渲染失败', error)
        }
      }

      clear() {
        if (this.ctx) {
          this.ctx.clearRect(0, 0, 300, 300)
        }
      }

      supportsAnimation() {
        return false // 降级实现不支持动画
      }

      supportsInteraction() {
        return true
      }
    }
    
    return new WeixinRendererFallback(capabilities)
  }
  // #endif
  
  // #ifndef MP-WEIXIN
  return createFallbackRenderer(capabilities)
  // #endif
}

/**
 * 创建通用小程序渲染器
 */
function createMiniProgramRenderer(capabilities) {
  class MiniProgramRenderer extends BaseRenderer {
    constructor(capabilities) {
      super(capabilities)
      this.type = 'miniprogram'
    }

    async init(canvasId, context = null) {
      try {
        this.canvasId = canvasId
        this.ctx = uni.createCanvasContext(canvasId, context)
        
        if (!this.ctx) {
          throw new Error('无法创建小程序Canvas上下文')
        }
        
        this.isInitialized = true
        this.log('info', '小程序渲染器初始化成功')
        return true
        
      } catch (error) {
        this.log('error', '小程序渲染器初始化失败', error)
        return false
      }
    }

    draw(data, options = {}) {
      this.log('info', '开始小程序渲染', { dataLength: data.length })
      // TODO: 实现具体的小程序Canvas绘制逻辑
    }

    clear() {
      if (this.ctx) {
        this.ctx.clearRect(0, 0, 300, 300)
        this.ctx.draw()
      }
    }

    supportsAnimation() {
      return true // 使用setTimeout
    }

    supportsInteraction() {
      return true
    }
  }
  
  return new MiniProgramRenderer(capabilities)
}

/**
 * 创建App渲染器
 */
function createAppRenderer(capabilities) {
  // #ifdef APP-PLUS
  try {
    // 导入专用的App渲染器
    const { AppRenderer } = require('./AppRenderer.js')
    return new AppRenderer(capabilities)
  } catch (error) {
    console.error('导入App渲染器失败，使用内联实现:', error)
    
    // 降级到内联实现
    class AppRendererFallback extends BaseRenderer {
      constructor(capabilities) {
        super(capabilities)
        this.type = 'app-fallback'
      }

      async init(canvasId, context = null) {
        try {
          this.canvasId = canvasId
          
          // App平台需要更长的等待时间
          await new Promise(resolve => setTimeout(resolve, 300))
          
          this.ctx = uni.createCanvasContext(canvasId)
          
          if (!this.ctx) {
            throw new Error('无法创建App Canvas上下文')
          }
          
          this.isInitialized = true
          this.log('info', 'App降级渲染器初始化成功')
          return true
          
        } catch (error) {
          this.log('error', 'App降级渲染器初始化失败', error)
          return false
        }
      }

      draw(data, options = {}) {
        if (!this.isInitialized || !this.ctx) {
          this.log('warn', '渲染器未初始化')
          return
        }
        
        this.log('info', '开始App降级渲染', { dataLength: data.length })
        
        // 简化的饼图绘制实现
        try {
          const width = options.width || 300
          const height = options.height || 300
          const centerX = width / 2
          const centerY = height / 2
          const outerRadius = Math.min(centerX, centerY) - 40
          const innerRadius = outerRadius * 0.6
          
          // 清空画布
          this.clear()
          
          if (data.length === 0) {
            // 绘制空状态
            this.ctx.setFillStyle('#f0f0f0')
            this.ctx.beginPath()
            this.ctx.moveTo(centerX, centerY)
            this.ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI)
            this.ctx.moveTo(centerX + innerRadius, centerY)
            this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, true)
            this.ctx.fill()
            this.ctx.draw()
            return
          }
          
          // 计算总值
          const total = data.reduce((sum, item) => sum + (item.value || item.amount || 0), 0)
          if (total <= 0) return
          
          // 绘制扇形
          let currentAngle = -Math.PI / 2
          data.forEach((item) => {
            const value = item.value || item.amount || 0
            if (value <= 0) return
            
            const angle = (value / total) * 2 * Math.PI
            const endAngle = currentAngle + angle
            
            this.ctx.setFillStyle(item.color || '#ccc')
            this.ctx.beginPath()
            this.ctx.moveTo(centerX, centerY)
            this.ctx.arc(centerX, centerY, outerRadius, currentAngle, endAngle)
            this.ctx.lineTo(centerX + Math.cos(endAngle) * innerRadius, centerY + Math.sin(endAngle) * innerRadius)
            this.ctx.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true)
            this.ctx.closePath()
            this.ctx.fill()
            
            // 绘制边框
            this.ctx.setStrokeStyle('#ffffff')
            this.ctx.setLineWidth(1)
            this.ctx.stroke()
            
            currentAngle = endAngle
          })
          
          // 绘制中心圆
          this.ctx.setFillStyle('#ffffff')
          this.ctx.beginPath()
          this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
          this.ctx.fill()
          
          this.ctx.draw()
          
          // App平台可能需要调用update
          setTimeout(() => {
            if (this.ctx && this.ctx.update) {
              this.ctx.update()
            }
          }, 50)
          
        } catch (error) {
          this.log('error', 'App降级渲染失败', error)
        }
      }

      clear() {
        if (this.ctx) {
          this.ctx.clearRect(0, 0, 300, 300)
        }
      }

      supportsAnimation() {
        return false // 降级实现不支持动画
      }

      supportsInteraction() {
        return true
      }
    }
    
    return new AppRendererFallback(capabilities)
  }
  // #endif
  
  // #ifndef APP-PLUS
  return createFallbackRenderer(capabilities)
  // #endif
}

/**
 * 创建CSS降级渲染器
 */
function createCSSRenderer(capabilities) {
  class CSSRenderer extends BaseRenderer {
    constructor(capabilities) {
      super(capabilities)
      this.type = 'css'
    }

    async init(canvasId, context = null) {
      // CSS渲染器不需要Canvas
      this.isInitialized = true
      this.log('info', 'CSS渲染器初始化成功')
      return true
    }

    draw(data, options = {}) {
      this.log('info', '开始CSS渲染', { dataLength: data.length })
      // TODO: 实现CSS渲染逻辑
      // CSS渲染主要通过Vue响应式数据驱动模板更新
    }

    clear() {
      // CSS渲染器通过数据清空实现
    }

    supportsAnimation() {
      return true // CSS动画
    }

    supportsInteraction() {
      return true // DOM事件
    }
  }
  
  return new CSSRenderer(capabilities)
}

/**
 * 创建降级渲染器
 */
function createFallbackRenderer(capabilities) {
  class FallbackRenderer extends BaseRenderer {
    constructor(capabilities) {
      super(capabilities)
      this.type = 'fallback'
    }

    async init(canvasId, context = null) {
      this.log('warn', '使用降级渲染器')
      this.isInitialized = true
      return true
    }

    draw(data, options = {}) {
      this.log('warn', '降级渲染器不支持绘制')
    }

    clear() {
      // 无需清空
    }

    supportsAnimation() {
      return false
    }

    supportsInteraction() {
      return false
    }
  }
  
  return new FallbackRenderer(capabilities)
}

/**
 * 获取支持的渲染器列表
 */
export function getSupportedRenderers() {
  const renderers = []
  
  // #ifdef H5
  renderers.push('web')
  // #endif
  
  // #ifdef MP-WEIXIN
  renderers.push('weixin')
  // #endif
  
  // #ifdef MP
  renderers.push('miniprogram')
  // #endif
  
  // #ifdef APP-PLUS
  renderers.push('app')
  // #endif
  
  // 通用支持
  renderers.push('css', 'fallback')
  
  return renderers
}

/**
 * 检查渲染器兼容性
 */
export function checkRendererCompatibility(rendererType, capabilities) {
  switch (rendererType) {
    case 'web':
      return capabilities.platform.isWeb && capabilities.canvas.hasCanvas2D
    
    case 'weixin':
      return capabilities.platform.isMiniProgram && capabilities.canvas.hasCanvasContext
    
    case 'miniprogram':
      return capabilities.platform.isMiniProgram && capabilities.canvas.hasCanvasContext
    
    case 'app':
      return capabilities.platform.isApp && capabilities.canvas.hasCanvasContext
    
    case 'css':
      return true // CSS方案总是兼容的
    
    case 'fallback':
      return true // 降级方案总是兼容的
    
    default:
      return false
  }
}

export default {
  createRenderer,
  getSupportedRenderers,
  checkRendererCompatibility
}