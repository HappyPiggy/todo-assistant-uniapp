import { ref, computed } from 'vue'

export function useArchiveData() {
  const archivedBooks = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // 归档统计数据计算
  const archiveStats = computed(() => {
    const books = archivedBooks.value
    
    if (!books.length) {
      return {
        totalBooks: 0,
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        totalMembers: 0
      }
    }
    
    // 统计总数据
    const totalBooks = books.length
    const totalTasks = books.reduce((sum, book) => sum + (book.item_count || 0), 0)
    const completedTasks = books.reduce((sum, book) => sum + (book.completed_count || 0), 0)
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    // 统计去重成员数（基于成员ID去重）
    const memberIds = new Set()
    books.forEach(book => {
      if (book.members && Array.isArray(book.members)) {
        book.members.forEach(member => memberIds.add(member.user_id || member._id))
      } else {
        // 如果没有成员详情，至少计算创建者
        memberIds.add(book.creator_id)
      }
    })
    const totalMembers = memberIds.size
    
    return {
      totalBooks,
      totalTasks,
      completedTasks,
      completionRate,
      totalMembers
    }
  })
  
  // 加载归档项目册数据
  const loadArchivedBooks = async (options = {}) => {
    try {
      loading.value = true
      error.value = null
      
      console.log('开始加载归档项目册数据...')
      
      // 调用云函数获取已归档项目册，包含成员信息用于统计
      const todoBookCo = uniCloud.importObject('todobook-co')
      
      // 记录调用参数
      const requestParams = {
        include_archived: true,
        archived_only: true,
        include_members: true,  // 需要成员信息来计算去重成员数
        ...options
      }
      console.log('调用云函数 getTodoBooks，参数:', JSON.stringify(requestParams, null, 2))
      
      const result = await todoBookCo.getTodoBooks(requestParams)
      
      console.log('归档项目册云函数返回结果 - 完整响应:', JSON.stringify(result, null, 2))
      
      if (result.code === 0) {
        const books = result.data.list || result.data || []
        archivedBooks.value = books
        
        console.log('===================== 归档数据详细信息 =====================')
        console.log('归档项目册数据加载成功，总数量:', books.length)
        
        // 详细记录每个归档项目册的关键信息
        books.forEach((book, index) => {
          console.log(`归档项目册 ${index + 1}:`)
          console.log('  - ID:', book._id)
          console.log('  - 标题:', book.title)
          console.log('  - 是否归档:', book.is_archived)
          console.log('  - 归档时间 (archived_at):', book.archived_at)
          console.log('  - 归档时间类型:', typeof book.archived_at)
          console.log('  - 任务数 (item_count):', book.item_count)
          console.log('  - 已完成数 (completed_count):', book.completed_count)
          console.log('  - 成员数 (member_count):', book.member_count)
          console.log('  - 创建时间:', book.created_at)
          console.log('  - 更新时间:', book.updated_at)
          console.log('  - 完整数据:', JSON.stringify(book, null, 2))
          console.log('---')
        })
        console.log('===================== 归档数据信息结束 =====================')
        
        return books
      }
      throw new Error(result.message || '加载归档项目册失败')
      
    } catch (err) {
      console.error('加载归档项目册失败:', err)
      error.value = err.message || '加载失败，请重试'
      
      // 显示错误提示
      uni.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })
      
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 取消归档操作（预留功能）
  const unarchiveTodoBook = async (bookId) => {
    try {
      console.log('取消归档项目册:', bookId)
      
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.updateTodoBook(bookId, {
        is_archived: false,
        archived_at: null
      })
      
      if (result.code === 0) {
        // 重新加载归档数据
        await loadArchivedBooks()
        
        uni.showToast({
          title: '已取消归档',
          icon: 'success'
        })
        
        return result
      }
      
      throw new Error(result.message || '取消归档失败')
      
    } catch (err) {
      console.error('取消归档失败:', err)
      uni.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      })
      throw err
    }
  }
  
  // 刷新数据
  const refreshArchivedBooks = async () => {
    return await loadArchivedBooks()
  }
  
  // 清空数据
  const clearArchivedBooks = () => {
    archivedBooks.value = []
    error.value = null
  }
  
  return {
    archivedBooks,
    loading,
    error,
    archiveStats,
    loadArchivedBooks,
    unarchiveTodoBook,
    refreshArchivedBooks,
    clearArchivedBooks
  }
}