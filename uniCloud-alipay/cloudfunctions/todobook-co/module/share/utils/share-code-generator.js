/**
 * 分享码生成工具
 */

/**
 * 生成6位随机分享码
 * @returns {string} 6位字母数字组合
 */
function generateShareCode() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成唯一分享码
 * @param {object} db - 数据库对象
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<string>} 唯一的分享码
 */
async function generateUniqueShareCode(db, maxRetries = 10) {
  const shareCollection = db.collection('todobook_shares')
  
  for (let i = 0; i < maxRetries; i++) {
    const shareCode = generateShareCode()
    
    // 检查分享码是否已存在
    const existingShare = await shareCollection.where({
      share_code: shareCode
    }).get()
    
    if (existingShare.data.length === 0) {
      return shareCode
    }
  }
  
  throw new Error('生成唯一分享码失败，请重试')
}

module.exports = {
  generateShareCode,
  generateUniqueShareCode
}