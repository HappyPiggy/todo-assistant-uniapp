/**
 * 坐标转换和触摸检测工具
 * 处理不同平台的坐标系统差异
 */

/**
 * 获取Canvas相对坐标（Web平台）
 * @param {Event} event 触摸/鼠标事件
 * @param {HTMLElement} canvasElement Canvas元素
 * @returns {Object} {x, y} 相对坐标
 */
export function getWebCanvasCoordinates(event, canvasElement) {
  if (!canvasElement) return { x: 0, y: 0 }
  
  try {
    const rect = canvasElement.getBoundingClientRect()
    const touch = event.touches?.[0] || event
    
    return {
      x: (touch.clientX || touch.pageX || 0) - rect.left,
      y: (touch.clientY || touch.pageY || 0) - rect.top
    }
  } catch (error) {
    console.warn('Web坐标获取失败:', error)
    return { x: 0, y: 0 }
  }
}

/**
 * 获取小程序Canvas坐标
 * @param {Event} event 触摸事件
 * @param {string} canvasId Canvas ID
 * @returns {Promise<Object>} {x, y} 坐标
 */
export async function getMiniProgramCanvasCoordinates(event, canvasId) {
  const touch = event.touches?.[0]
  if (!touch) return { x: 0, y: 0 }
  
  try {
    // #ifdef MP-WEIXIN
    // 微信小程序直接使用touch.x/y
    return {
      x: touch.x || 0,
      y: touch.y || 0
    }
    // #endif
    
    // #ifndef MP-WEIXIN
    // 其他小程序平台
    return {
      x: touch.x || touch.clientX || 0,
      y: touch.y || touch.clientY || 0
    }
    // #endif
  } catch (error) {
    console.warn('小程序坐标获取失败:', error)
    return { x: 0, y: 0 }
  }
}

/**
 * 获取App平台Canvas坐标
 * @param {Event} event 触摸事件
 * @param {string} canvasId Canvas ID
 * @returns {Promise<Object>} {x, y} 坐标
 */
export async function getAppCanvasCoordinates(event, canvasId) {
  const touch = event.touches?.[0]
  if (!touch) return { x: 0, y: 0 }
  
  try {
    // 使用createSelectorQuery查询Canvas位置
    return new Promise((resolve) => {
      const query = uni.createSelectorQuery()
      query.select(`#${canvasId}`).boundingClientRect()
      query.exec((res) => {
        if (res && res[0]) {
          const rect = res[0]
          resolve({
            x: (touch.pageX || touch.clientX || 0) - rect.left,
            y: (touch.pageY || touch.clientY || 0) - rect.top
          })
        } else {
          // 降级方案：直接使用touch坐标
          resolve({
            x: touch.x || touch.clientX || 0,
            y: touch.y || touch.clientY || 0
          })
        }
      })
    })
  } catch (error) {
    console.warn('App坐标获取失败:', error)
    return { x: 0, y: 0 }
  }
}

/**
 * 通用坐标获取函数
 * @param {Event} event 事件对象
 * @param {string} canvasId Canvas ID
 * @param {string} platform 平台类型
 * @param {HTMLElement} canvasElement Canvas元素（Web平台使用）
 * @returns {Promise<Object>} {x, y} 坐标
 */
export async function getCanvasCoordinates(event, canvasId, platform, canvasElement = null) {
  switch (platform) {
    case 'web':
      return getWebCanvasCoordinates(event, canvasElement)
    
    case 'miniprogram':
    case 'weixin':
      return getMiniProgramCanvasCoordinates(event, canvasId)
    
    case 'app':
      return getAppCanvasCoordinates(event, canvasId)
    
    default:
      // 降级处理
      const touch = event.touches?.[0] || event
      return {
        x: touch.x || touch.clientX || touch.pageX || 0,
        y: touch.y || touch.clientY || touch.pageY || 0
      }
  }
}

/**
 * 极坐标转笛卡尔坐标
 * @param {number} centerX 中心X坐标
 * @param {number} centerY 中心Y坐标
 * @param {number} radius 半径
 * @param {number} angle 角度（弧度）
 * @returns {Object} {x, y} 笛卡尔坐标
 */
export function polarToCartesian(centerX, centerY, radius, angle) {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  }
}

/**
 * 笛卡尔坐标转极坐标
 * @param {number} centerX 中心X坐标
 * @param {number} centerY 中心Y坐标
 * @param {number} x 点的X坐标
 * @param {number} y 点的Y坐标
 * @returns {Object} {radius, angle} 极坐标
 */
export function cartesianToPolar(centerX, centerY, x, y) {
  const dx = x - centerX
  const dy = y - centerY
  return {
    radius: Math.sqrt(dx * dx + dy * dy),
    angle: Math.atan2(dy, dx)
  }
}

/**
 * 检测点是否在扇形内
 * @param {number} pointX 点的X坐标
 * @param {number} pointY 点的Y坐标
 * @param {Object} segment 扇形信息
 * @param {Object} drawParams 绘制参数
 * @returns {boolean} 是否在扇形内
 */
export function isPointInSegment(pointX, pointY, segment, drawParams) {
  const { centerX, centerY, innerRadius, outerRadius } = drawParams
  const { startAngle, endAngle } = segment
  
  // 转换为极坐标
  const polar = cartesianToPolar(centerX, centerY, pointX, pointY)
  
  // 检查半径范围（允许一定误差）
  const tolerance = 10
  if (polar.radius < innerRadius - tolerance || polar.radius > outerRadius + tolerance) {
    return false
  }
  
  // 标准化角度到 0-2π 范围
  let angle = polar.angle + Math.PI / 2 // 调整起始角度到顶部
  if (angle < 0) angle += 2 * Math.PI
  
  let normalizedStartAngle = startAngle + Math.PI / 2
  let normalizedEndAngle = endAngle + Math.PI / 2
  
  if (normalizedStartAngle < 0) normalizedStartAngle += 2 * Math.PI
  if (normalizedEndAngle < 0) normalizedEndAngle += 2 * Math.PI
  
  // 处理跨越0度的情况
  if (normalizedEndAngle < normalizedStartAngle) {
    return angle >= normalizedStartAngle || angle <= normalizedEndAngle
  } else {
    return angle >= normalizedStartAngle && angle <= normalizedEndAngle
  }
}

/**
 * 计算两点之间的距离
 * @param {number} x1 第一个点的X坐标
 * @param {number} y1 第一个点的Y坐标
 * @param {number} x2 第二个点的X坐标
 * @param {number} y2 第二个点的Y坐标
 * @returns {number} 距离
 */
export function getDistance(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 角度标准化到 0-2π 范围
 * @param {number} angle 角度（弧度）
 * @returns {number} 标准化后的角度
 */
export function normalizeAngle(angle) {
  while (angle < 0) angle += 2 * Math.PI
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI
  return angle
}

/**
 * 检测扇形边界
 * @param {Array} segments 扇形数组
 * @param {Object} drawParams 绘制参数
 * @returns {Object} 边界信息
 */
export function getSegmentBounds(segments, drawParams) {
  if (!segments.length) return null
  
  const { centerX, centerY, outerRadius } = drawParams
  
  let minX = centerX - outerRadius
  let maxX = centerX + outerRadius
  let minY = centerY - outerRadius
  let maxY = centerY + outerRadius
  
  segments.forEach(segment => {
    const { startAngle, endAngle } = segment
    
    // 检查关键点
    const points = [
      polarToCartesian(centerX, centerY, outerRadius, startAngle),
      polarToCartesian(centerX, centerY, outerRadius, endAngle),
      polarToCartesian(centerX, centerY, outerRadius, (startAngle + endAngle) / 2)
    ]
    
    points.forEach(point => {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    })
  })
  
  return { minX, maxX, minY, maxY }
}

/**
 * 创建触摸区域检测器
 * @param {Object} drawParams 绘制参数
 * @returns {Function} 检测函数
 */
export function createHitTester(drawParams) {
  return function(x, y, segments) {
    // 快速排除明显不在范围内的点
    const { centerX, centerY, outerRadius } = drawParams
    const distance = getDistance(x, y, centerX, centerY)
    
    if (distance > outerRadius + 20) {
      return null
    }
    
    // 逐个检测扇形
    for (const segment of segments) {
      if (isPointInSegment(x, y, segment, drawParams)) {
        return segment
      }
    }
    
    return null
  }
}

/**
 * 计算扇形标签最佳位置
 * @param {Object} segment 扇形信息
 * @param {Object} drawParams 绘制参数
 * @param {number} labelDistance 标签距离
 * @returns {Object} 标签位置信息
 */
export function calculateLabelPosition(segment, drawParams, labelDistance = 30) {
  const { centerX, centerY, outerRadius } = drawParams
  const { midAngle } = segment
  
  const labelRadius = outerRadius + labelDistance
  const position = polarToCartesian(centerX, centerY, labelRadius, midAngle)
  
  // 判断标签应该在左侧还是右侧
  const isRightSide = Math.cos(midAngle) >= 0
  
  return {
    x: position.x,
    y: position.y,
    align: isRightSide ? 'left' : 'right',
    side: isRightSide ? 'right' : 'left'
  }
}

export default {
  getCanvasCoordinates,
  getWebCanvasCoordinates,
  getMiniProgramCanvasCoordinates,
  getAppCanvasCoordinates,
  polarToCartesian,
  cartesianToPolar,
  isPointInSegment,
  getDistance,
  normalizeAngle,
  getSegmentBounds,
  createHitTester,
  calculateLabelPosition
}