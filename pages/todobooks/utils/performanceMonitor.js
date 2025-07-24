/**
 * 性能监控工具
 * 用于监控任务评论加载优化的效果
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      commentLoadRequests: 0,
      cacheHitRate: 0,
      networkRequestCount: 0,
      startTime: null
    }
    this.isEnabled = true // 可以通过配置关闭
  }

  /**
   * 开始性能监控
   */
  startMonitoring(pageName = 'unknown') {
    if (!this.isEnabled) return
    
    this.metrics.startTime = Date.now()
    this.metrics.pageName = pageName
    // console.log(`🚀 开始监控页面性能: ${pageName}`)
  }

  /**
   * 记录页面加载完成
   */
  recordPageLoaded() {
    if (!this.isEnabled || !this.metrics.startTime) return
    
    this.metrics.pageLoadTime = Date.now() - this.metrics.startTime
    // console.log(`📊 页面加载耗时: ${this.metrics.pageLoadTime}ms`)
  }

  /**
   * 记录评论加载请求
   */
  recordCommentRequest(type = 'network') {
    if (!this.isEnabled) return
    
    this.metrics.commentLoadRequests++
    if (type === 'network') {
      this.metrics.networkRequestCount++
    }
    
    // // 减少日志频率，避免在大量任务时产生过多日志
    if (type === 'network' || this.metrics.commentLoadRequests % 10 === 0) {
      console.log(`💬 评论请求 - 类型: ${type}, 总请求数: ${this.metrics.commentLoadRequests}`)
    }
  }

  /**
   * 更新缓存命中率
   */
  updateCacheHitRate(cacheStats) {
    if (!this.isEnabled) return
    
    if (cacheStats && cacheStats.hitRate) {
      this.metrics.cacheHitRate = cacheStats.hitRate
      
      // 减少日志频率，每10次更新才输出一次
      // if (this.metrics.commentLoadRequests % 10 === 0) {
      //   console.log(`🎯 缓存命中率: ${this.metrics.cacheHitRate}`)
      // }
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    if (!this.isEnabled) return null
    
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      summary: {
        pageLoadTime: `${this.metrics.pageLoadTime}ms`,
        totalRequests: this.metrics.commentLoadRequests,
        networkRequests: this.metrics.networkRequestCount,
        cacheRequests: this.metrics.commentLoadRequests - this.metrics.networkRequestCount,
        cacheHitRate: this.metrics.cacheHitRate,
        networkSavings: this.metrics.commentLoadRequests > 0 
          ? `${((this.metrics.commentLoadRequests - this.metrics.networkRequestCount) / this.metrics.commentLoadRequests * 100).toFixed(1)}%`
          : '0%'
      }
    }
  }

  /**
   * 打印性能报告
   */
  printReport() {
    if (!this.isEnabled) return
    
    const report = this.getPerformanceReport()
    console.log('📈 性能监控报告:')
    console.log('====================')
    console.log(`页面: ${report.pageName}`)
    console.log(`加载时间: ${report.summary.pageLoadTime}`)
    console.log(`总请求数: ${report.summary.totalRequests}`)
    console.log(`网络请求: ${report.summary.networkRequests}`)
    console.log(`缓存请求: ${report.summary.cacheRequests}`)
    console.log(`缓存命中率: ${report.summary.cacheHitRate}`)
    console.log(`网络节省: ${report.summary.networkSavings}`)
    console.log('====================')
  }

  /**
   * 重置监控数据
   */
  reset() {
    this.metrics = {
      pageLoadTime: 0,
      commentLoadRequests: 0,
      cacheHitRate: 0,
      networkRequestCount: 0,
      startTime: null
    }
  }

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled) {
    this.isEnabled = enabled
  }
}

// 全局单例实例
let globalMonitor = null

/**
 * 获取全局性能监控实例
 */
export function getGlobalPerformanceMonitor() {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor()
  }
  return globalMonitor
}

export default PerformanceMonitor