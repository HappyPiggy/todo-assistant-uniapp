import { ref } from 'vue'

/**
 * 分享数据操作组合式函数
 * @returns {Object} 分享操作方法
 */
export function useShareData() {
  // 响应式数据
  const myShares = ref([])
  const shareLoading = ref(false)
  const importLoading = ref(false)
  const error = ref(null)

  /**
   * 创建分享
   * @param {string} todBookId - 项目册ID
   * @param {boolean} includeComments - 是否包含评论
   * @returns {Promise<Object>} 分享结果
   */
  const createShare = async (todBookId, includeComments = false) => {
    shareLoading.value = true
    error.value = null
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.createShare(todBookId, includeComments)
      
      if (result.code === 0) {
        // 重新加载分享列表
        await loadMyShares()
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('创建分享失败:', err)
      error.value = err.message
      throw err
    } finally {
      shareLoading.value = false
    }
  }

  /**
   * 删除分享
   * @param {string} shareId - 分享ID
   */
  const deleteShare = async (shareId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.deleteShare(shareId)
      
      if (result.code === 0) {
        // 重新加载分享列表
        await loadMyShares()
        uni.showToast({
          title: '分享已删除',
          icon: 'success'
        })
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('删除分享失败:', err)
      error.value = err.message
      uni.showToast({
        title: err.message,
        icon: 'none'
      })
      throw err
    }
  }

  /**
   * 加载我的分享列表
   */
  const loadMyShares = async () => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getMyShares()
      
      if (result.code === 0) {
        myShares.value = result.data || []
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('加载分享列表失败:', err)
      error.value = err.message
      myShares.value = []
    }
  }

  /**
   * 通过分享码导入项目册
   * @param {string} shareCode - 分享码
   * @returns {Promise<Object>} 导入结果
   */
  const importByShareCode = async (shareCode) => {
    importLoading.value = true
    error.value = null
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.importByCode(shareCode)
      
      if (result.code === 0) {
        // 触发项目册列表更新
        uni.$emit('todobooks-updated')
        uni.showToast({
          title: '导入成功',
          icon: 'success'
        })
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('导入分享失败:', err)
      error.value = err.message
      uni.showToast({
        title: err.message,
        icon: 'none'
      })
      throw err
    } finally {
      importLoading.value = false
    }
  }

  /**
   * 获取分享预览
   * @param {string} shareCode - 分享码
   * @returns {Promise<Object>} 预览信息
   */
  const getSharePreview = async (shareCode) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getSharePreview(shareCode)
      
      if (result.code === 0) {
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('获取分享预览失败:', err)
      error.value = err.message
      throw err
    }
  }

  /**
   * 复制文本到剪贴板
   * @param {string} text - 要复制的文本
   * @param {string} successMsg - 成功提示消息
   */
  const copyToClipboard = (text, successMsg = '已复制到剪贴板') => {
    // #ifdef H5
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        uni.showToast({
          title: successMsg,
          icon: 'success'
        })
      }).catch(() => {
        // 降级到传统方法
        fallbackCopyTextToClipboard(text, successMsg)
      })
    } else {
      fallbackCopyTextToClipboard(text, successMsg)
    }
    // #endif
    
    // #ifndef H5
    uni.setClipboardData({
      data: text,
      success: () => {
        uni.showToast({
          title: successMsg,
          icon: 'success'
        })
      },
      fail: () => {
        uni.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
    // #endif
  }

  /**
   * H5 降级复制方法
   * @param {string} text - 要复制的文本
   * @param {string} successMsg - 成功提示消息
   */
  const fallbackCopyTextToClipboard = (text, successMsg) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        uni.showToast({
          title: successMsg,
          icon: 'success'
        })
      } else {
        uni.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('复制失败:', err)
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
    
    document.body.removeChild(textArea)
  }

  return {
    // 响应式数据
    myShares,
    shareLoading,
    importLoading,
    error,
    
    // 方法
    createShare,
    deleteShare,
    loadMyShares,
    importByShareCode,
    getSharePreview,
    copyToClipboard
  }
}