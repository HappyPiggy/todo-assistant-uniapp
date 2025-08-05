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
    shareLoading.value = true
    error.value = null
    
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
      throw err
    } finally {
      shareLoading.value = false
    }
  }

  /**
   * 通过分享码导入项目册
   * @param {string} shareCode - 分享码
   * @param {Object} options - 导入选项
   * @param {boolean} options.allowDuplicate - 是否允许重复导入
   * @returns {Promise<Object>} 导入结果
   */
  const importByShareCode = async (shareCode, options = {}) => {
    const { allowDuplicate = false } = options
    importLoading.value = true
    error.value = null
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.importByCode(shareCode, allowDuplicate)
      
      if (result.code === 0) {
        // 导入成功后重新加载项目册列表并触发更新事件
        // 使用 useBookData 的方法确保数据正确更新
        const { useBookData } = await import('@/pages/todobooks/composables/useBookData.js')
        const { refreshTodoBooks } = useBookData()
        
        try {
          // 重新加载最新的项目册列表
          await refreshTodoBooks()
        } catch (refreshError) {
          console.error('刷新项目册列表失败:', refreshError)
          // 即使刷新失败，也触发一个空数组事件，防止前端接收到 undefined
          uni.$emit('todobooks-updated', [])
        }
        
        uni.showToast({
          title: '导入成功',
          icon: 'success'
        })
        return result.data
      } else if (result.code === 1005) {
        // 重复导入的特殊处理
        const duplicateError = new Error(result.message)
        duplicateError.code = 1005
        duplicateError.data = result.data
        throw duplicateError
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('导入分享失败:', err)
      error.value = err.message
      
      // 对于重复导入错误，不显示toast，由调用方处理
      if (err.code !== 1005) {
        uni.showToast({
          title: err.message,
          icon: 'none'
        })
      }
      
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
   * 检查项目册的分享状态
   * @param {string} todoBookId - 项目册ID
   * @returns {Promise<Object>} 分享状态信息
   */
  const checkShareStatus = async (todoBookId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.checkShareStatus({ todoBookId })
      
      if (result.code === 0) {
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('检查分享状态失败:', err)
      error.value = err.message
      throw err
    }
  }

  /**
   * 同步分享内容到云端
   * @param {string} shareId - 分享ID
   * @returns {Promise<Object>} 同步结果
   */
  const syncShare = async (shareId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.syncShare({ shareId })
      
      if (result.code === 0) {
        uni.showToast({
          title: '同步成功',
          icon: 'success'
        })
        return result.data
      } else if (result.code === 2001) {
        // 时间限制错误
        const err = new Error(result.message)
        err.code = result.code
        err.data = result.data
        throw err
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('同步分享失败:', err)
      error.value = err.message
      
      // 对于非时间限制错误，显示toast
      if (err.code !== 2001) {
        uni.showToast({
          title: err.message,
          icon: 'none',
          duration: 3000
        })
      }
      
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
    checkShareStatus,
    syncShare,
    copyToClipboard
  }
}