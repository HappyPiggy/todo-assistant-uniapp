/**
 * 测试版微信登录云函数
 */
module.exports = async function (params = {}) {
  console.log('[测试-微信登录] 开始执行')
  console.log('[测试-微信登录] 参数:', params)
  
  try {
    // 简单的参数验证
    if (!params.code) {
      throw new Error('缺少code参数')
    }
    
    console.log('[测试-微信登录] 参数验证通过')
    
    // 测试获取配置
    try {
      const clientInfo = this.getUniversalClientInfo()
      console.log('[测试-微信登录] 客户端信息:', clientInfo)
      
      const oauthConfig = this.configUtils.getOauthConfig({ provider: 'weixin' })
      console.log('[测试-微信登录] OAuth配置:', oauthConfig)
      
    } catch (configError) {
      console.error('[测试-微信登录] 配置获取失败:', configError)
    }
    
    // 返回一个简单的测试结果
    return {
      success: true,
      message: '测试版微信登录执行成功',
      code: params.code
    }
    
  } catch (error) {
    console.error('[测试-微信登录] 错误:', error)
    throw error
  }
}