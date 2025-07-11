import { ref, computed } from 'vue'
import { API_CODES, ERROR_MESSAGES } from '@/pages/todobooks/utils/constants.js'

/**
 * 项目册数据管理组合式函数
 * @param {string} bookId - 项目册ID（可选）
 * @returns {Object} 项目册数据和操作方法
 */
export function useBookData(bookId = null) {
  console.log('useBookData 初始化, bookId:', bookId)
  
  // 响应式数据
  const bookData = ref({})
  const loading = ref(false)
  const error = ref(null)
  const memberCount = ref(0)

  
  /**
   * 加载项目册详情
   * @param {string} id - 项目册ID
   */
  const loadBookDetail = async (id = bookId) => {
    
    if (!id) {
      console.log('loadBookDetail 错误: 项目册ID不能为空')
      error.value = '项目册ID不能为空'
      return
    }
    
    if (loading.value) {
      console.log('loadBookDetail 跳过: 正在加载中')
      return
    }
    
    console.log('设置 loading = true')
    loading.value = true
    error.value = null
    
    try {
      const todoBooksObj = uniCloud.importObject('todobook-co')
      
      const result = await todoBooksObj.getTodoBookDetail(id)
      
      if (result.code === API_CODES.SUCCESS) {
        bookData.value = result.data.book
        memberCount.value = result.data.members ? result.data.members.length : 0
        // console.log('loadBookDetail 成功, 更新后 bookData.value:', JSON.stringify(bookData.value, null, 2))
        
        // 设置页面标题
        if (bookData.value && bookData.value.title) {
          uni.setNavigationBarTitle({
            title: bookData.value.title
          })
        }
      } else {
        console.log('loadBookDetail 失败, 错误信息:', result.message)
        error.value = result.message || ERROR_MESSAGES.DATA_NOT_FOUND
        uni.showToast({
          title: error.value,
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('加载项目册详情失败:', err)
      error.value = ERROR_MESSAGES.NETWORK_ERROR
      uni.showToast({
        title: error.value,
        icon: 'none'
      })
    } finally {
      loading.value = false
      console.log('loading.value 现在是:', loading.value)
    }
  }
  
  
  /**
   * 删除项目册
   * @param {string} id - 项目册ID
   */
  const deleteBook = async (id = bookId) => {
    if (!id) {
      throw new Error('项目册ID不能为空')
    }
    
    try {
      const todoBooksObj = uniCloud.importObject('todobook-co')
      const result = await todoBooksObj.deleteTodoBook(id)
      
      if (result.code === API_CODES.SUCCESS) {
        // 清空本地数据
        bookData.value = {}
        memberCount.value = 0
        return result
      } else {
        throw new Error(result.message || ERROR_MESSAGES.OPERATION_FAILED)
      }
    } catch (err) {
      console.error('删除项目册失败:', err)
      throw err
    }
  }
  
  /**
   * 创建项目册
   * @param {Object} bookFormData - 项目册表单数据
   */
  const createBook = async (bookFormData) => {
    try {
      const todoBooksObj = uniCloud.importObject('todobook-co')
      const result = await todoBooksObj.createTodoBook(bookFormData)
      
      if (result.code === API_CODES.SUCCESS) {
        return result
      } else {
        throw new Error(result.message || ERROR_MESSAGES.OPERATION_FAILED)
      }
    } catch (err) {
      console.error('创建项目册失败:', err)
      throw err
    }
  }
  
  /**
   * 更新本地统计数据
   * @param {string} oldStatus - 旧状态
   * @param {string} newStatus - 新状态
   */
  const updateLocalStats = (oldStatus, newStatus) => {
    if (!bookData.value) return
    
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      bookData.value.completed_count = (bookData.value.completed_count || 0) + 1
    } else if (newStatus !== 'completed' && oldStatus === 'completed') {
      bookData.value.completed_count = Math.max(0, (bookData.value.completed_count || 0) - 1)
    }
  }
  
  /**
   * 刷新数据
   */
  const refreshData = async () => {
    if (bookId) {
      await loadBookDetail(bookId)
    }
  }
  
  /**
   * 重置状态
   */
  const resetState = () => {
    bookData.value = {}
    loading.value = false
    error.value = null
    memberCount.value = 0
  }
  
  return {
    // 响应式数据
    bookData,
    loading,
    error,
    memberCount,
    
    // 方法
    loadBookDetail,
    deleteBook,
    createBook,
    updateLocalStats,
    refreshData,
    resetState
  }
}