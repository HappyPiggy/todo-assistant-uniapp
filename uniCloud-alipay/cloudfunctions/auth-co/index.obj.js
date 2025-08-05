// 认证管理云对象
const uniID = require('uni-id-common')

module.exports = {
  _before: async function () {
    // 登录相关的云函数不需要token验证
    this.uniID = uniID.createInstance({
      context: this.getCloudInfo()
    })
    this.db = uniCloud.database()
  },

  /**
   * 微信登录测试
   */
  async loginByWeixinTest(params = {}) {
    console.log('[认证云对象-微信登录测试] 开始执行')
    console.log('[认证云对象-微信登录测试] 参数:', params)
    
    try {
      // 简单的参数验证
      if (!params.code) {
        throw new Error('缺少code参数')
      }
      
      console.log('[认证云对象-微信登录测试] 参数验证通过')
      
      // 测试获取配置
      try {
        const clientInfo = this.getCloudInfo()
        console.log('[认证云对象-微信登录测试] 云端信息:', clientInfo)
        
        // 尝试获取uni-id配置
        const config = this.uniID.config
        console.log('[认证云对象-微信登录测试] uni-id配置存在:', !!config)
        
      } catch (configError) {
        console.error('[认证云对象-微信登录测试] 配置获取失败:', configError)
      }
      
      // 返回一个简单的测试结果
      return {
        success: true,
        message: '测试版微信登录执行成功',
        code: params.code,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('[认证云对象-微信登录测试] 错误:', error)
      throw error
    }
  },

  /**
   * 微信登录
   */
  async loginByWeixin(params = {}) {
    console.log('[认证云对象-微信登录] 开始执行微信登录')
    console.log('[认证云对象-微信登录] 参数:', params)
    
    try {
      const { code } = params
      
      if (!code) {
        return {
          errCode: 'MISSING_CODE',
          errMsg: '缺少微信授权码'
        }
      }

      console.log('[认证云对象-微信登录] 调用uni-id微信登录')
      
      // 使用uni-id进行微信登录
      const result = await this.uniID.loginByWeixin({
        code: code
      })

      console.log('[认证云对象-微信登录] uni-id登录结果:', result)

      if (result.errCode) {
        console.error('[认证云对象-微信登录] 登录失败:', result)
        return result
      }

      // 登录成功，返回用户信息和token
      return {
        errCode: 0,
        ...result
      }

    } catch (error) {
      console.error('[认证云对象-微信登录] 登录异常:', error)
      return {
        errCode: 'LOGIN_ERROR',
        errMsg: error.message || '微信登录失败'
      }
    }
  }
}