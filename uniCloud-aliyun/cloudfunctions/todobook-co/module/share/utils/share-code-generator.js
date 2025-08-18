/**
 * 分享码生成工具
 */

/**
 * 生成6位随机分享码
 * @returns {string} 6位字母数字组合
 */
function generateShareCode() {
  // 排除容易混淆的字符: 0(零) O(欧) 1(一) I(爱) L(埃尔)
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  let result = ''
  
  // 确保第一位是字母，避免纯数字的分享码
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  result += letters.charAt(Math.floor(Math.random() * letters.length))
  
  // 生成剩余5位
  for (let i = 1; i < 6; i++) {
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
async function generateUniqueShareCode(db, maxRetries = 50) {
  const shareCollection = db.collection('todobook_shares')
  
  for (let i = 0; i < maxRetries; i++) {
    const shareCode = generateShareCode()
    
    try {
      // 检查分享码是否已存在（精确匹配，因为生成的都是大写）
      const existingShare = await shareCollection.where({
        share_code: shareCode
      }).get()
      
      if (existingShare.data.length === 0) {
        console.log(`成功生成唯一分享码: ${shareCode}，重试次数: ${i + 1}`)
        return shareCode
      } else {
        console.log(`分享码 ${shareCode} 已存在，继续重试...`)
      }
    } catch (queryError) {
      console.error(`查询分享码时出错: ${queryError.message}，继续重试...`)
      continue
    }
  }
  
  console.error(`生成唯一分享码失败，已重试 ${maxRetries} 次`)
  throw new Error('生成唯一分享码失败，请重试')
}

module.exports = {
  generateShareCode,
  generateUniqueShareCode
}