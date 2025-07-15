import { ref } from 'vue'
import { API_CODES, ERROR_MESSAGES } from '@/pages/todobooks/utils/constants.js'
import globalStore from '@/store/index.js'

/**
 * TodoBook 数据操作组合式函数
 * @returns {Object} TodoBook 操作方法
 */
export function useBookData() {
  // 响应式数据
  const bookData = ref({})
  const loading = ref(false)
  const error = ref(null)
  const memberCount = ref(0)

  /**
   * 加载 TodoBook 列表
   * @param {Object} options - 加载选项
   * @param {boolean} forceRefresh - 是否强制刷新（跳过缓存）
   * @returns {Promise<Array>} TodoBook 列表
   */
  const loadTodoBooks = async (options = {}, forceRefresh = false) => {
    if (!forceRefresh) {
      // 优先从缓存获取数据
      const cached = globalStore.todoBook.getTodoBooksFromCache()
      if (cached.success) {
        console.log('使用缓存数据:', cached.source)
        return cached.data
      }
    }

    // 缓存无效或强制刷新，从云端加载
    console.log(forceRefresh ? '强制刷新项目册...' : '缓存无效，从云端加载')
    const books = await globalStore.todoBook.loadTodoBooks({
      include_archived: false,
      ...options
    }, forceRefresh)

    return books
  }

  /**
   * 归档项目册
   * @param {string} bookId - 项目册ID
   * @returns {Promise<void>}
   */
  const archiveTodoBook = async (bookId) => {
    await globalStore.todoBook.updateTodoBook(bookId, {
      is_archived: true,
      archived_at: new Date()
    })
  }

  /**
   * 删除项目册
   * @param {string} bookId - 项目册ID
   * @returns {Promise<void>}
   */
  const deleteTodoBook = async (bookId) => {
    await globalStore.todoBook.deleteTodoBook(bookId)
  }

  /**
   * 创建项目册
   * @param {Object} bookData - 项目册数据
   * @returns {Promise<Object>} 创建的项目册
   */
  const createTodoBook = async (bookData) => {
    return await globalStore.todoBook.createTodoBook(bookData)
  }

  /**
   * 更新项目册
   * @param {string} bookId - 项目册ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的项目册
   */
  const updateTodoBook = async (bookId, updates) => {
    return await globalStore.todoBook.updateTodoBook(bookId, updates)
  }

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
    loadBookDetail,
    loadTodoBooks,
    archiveTodoBook,
    deleteTodoBook,
    createTodoBook,
    updateTodoBook
  }
}