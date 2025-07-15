import { ref } from 'vue'
import { API_CODES, ERROR_MESSAGES } from '@/pages/todobooks/utils/constants.js'

/**
 * 项目册数据管理组合式函数
 * @returns {Object} 项目册数据和操作方法
 */
export function useBookData() {
  
  // 响应式数据
  const bookData = ref({})
  const loading = ref(false)
  const error = ref(null)
  const memberCount = ref(0)

  
  /**
   * 加载项目册详情
   * @param {string} id - 项目册ID
   */
  const loadBookDetail = async (id) => {
    
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
    }
  }
  
  
  return {
    // 响应式数据
    bookData,
    loading,
    error,
    memberCount,
    
    // 方法
    loadBookDetail
  }
}