// 数据访问适配器
// 根据用户登录状态动态切换本地存储和云端数据访问
import { useAuthState } from '@/composables/useAuthState.js'
import { useLocalStorageManager } from '@/store/localStorageManager.js'

export function useDataAdapter() {
  const { isGuest } = useAuthState()
  const localManager = useLocalStorageManager()
  
  // =================== TodoBook 数据适配 ===================
  
  /**
   * 获取TodoBook列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} TodoBook列表
   */
  const getTodoBooks = async (options = {}) => {
    if (isGuest.value) {
      // 访客模式：从本地存储获取
      return await localManager.getTodoBooks()
    } else {
      // 登录模式：从云端获取
      return await getCloudTodoBooks(options)
    }
  }
  
  /**
   * 创建TodoBook
   * @param {Object} bookData - TodoBook数据
   * @returns {Promise<Object>} 创建的TodoBook
   */
  const createTodoBook = async (bookData) => {
    if (isGuest.value) {
      // 访客模式：保存到本地存储
      const newBook = await localManager.createTodoBook(bookData)
      // 获取最新的书籍列表并发送更新事件
      const updatedBooks = await localManager.getTodoBooks()
      uni.$emit('todobooks-updated', updatedBooks)
      return newBook
    } else {
      // 登录模式：保存到云端
      return await createCloudTodoBook(bookData)
    }
  }
  
  /**
   * 更新TodoBook
   * @param {String} bookId - TodoBook ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的TodoBook
   */
  const updateTodoBook = async (bookId, updateData) => {
    if (isGuest.value) {
      // 访客模式：更新本地存储
      const updatedBook = await localManager.updateTodoBook(bookId, updateData)
      // 获取最新的书籍列表并发送更新事件
      const updatedBooks = await localManager.getTodoBooks()
      uni.$emit('todobooks-updated', updatedBooks)
      return updatedBook
    } else {
      // 登录模式：更新云端数据
      return await updateCloudTodoBook(bookId, updateData)
    }
  }
  
  /**
   * 删除TodoBook
   * @param {String} bookId - TodoBook ID
   * @returns {Promise<Object>} 删除的TodoBook
   */
  const deleteTodoBook = async (bookId) => {
    if (isGuest.value) {
      // 访客模式：从本地存储删除
      const deletedBook = await localManager.deleteTodoBook(bookId)
      // 获取最新的书籍列表并发送更新事件
      const updatedBooks = await localManager.getTodoBooks()
      uni.$emit('todobooks-updated', updatedBooks)
      return deletedBook
    } else {
      // 登录模式：从云端删除
      return await deleteCloudTodoBook(bookId)
    }
  }
  
  /**
   * 获取单个TodoBook详情
   * @param {String} bookId - TodoBook ID
   * @returns {Promise<Object>} TodoBook详情
   */
  const getTodoBook = async (bookId) => {
    if (isGuest.value) {
      // 访客模式：从本地存储获取
      return await localManager.getTodoBook(bookId)
    } else {
      // 登录模式：从云端获取
      return await getCloudTodoBook(bookId)
    }
  }
  
  // =================== Task 数据适配 ===================
  
  /**
   * 获取任务列表
   * @param {String} bookId - TodoBook ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 任务列表
   */
  const getTasks = async (bookId, options = {}) => {
    if (isGuest.value) {
      // 访客模式：从本地存储获取
      return await localManager.getTasks(bookId, options)
    } else {
      // 登录模式：从云端获取
      return await getCloudTasks(bookId, options)
    }
  }
  
  /**
   * 创建任务
   * @param {String} bookId - TodoBook ID
   * @param {Object} taskData - 任务数据
   * @returns {Promise<Object>} 创建的任务
   */
  const createTask = async (bookId, taskData) => {
    if (isGuest.value) {
      // 访客模式：保存到本地存储
      const newTask = await localManager.createTask(bookId, taskData)
      // 发送更新事件
      uni.$emit('tasks-updated', { bookId })
      return newTask
    } else {
      // 登录模式：保存到云端
      return await createCloudTask(bookId, taskData)
    }
  }
  
  /**
   * 更新任务
   * @param {String} taskId - 任务ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的任务
   */
  const updateTask = async (taskId, updateData) => {
    if (isGuest.value) {
      // 访客模式：更新本地存储
      const updatedTask = await localManager.updateTask(taskId, updateData)
      // 发送更新事件
      uni.$emit('tasks-updated', { taskId })
      return updatedTask
    } else {
      // 登录模式：更新云端数据
      return await updateCloudTask(taskId, updateData)
    }
  }
  
  /**
   * 删除任务
   * @param {String} taskId - 任务ID
   * @returns {Promise<Object>} 删除的任务
   */
  const deleteTask = async (taskId) => {
    if (isGuest.value) {
      // 访客模式：从本地存储删除
      const deletedTask = await localManager.deleteTask(taskId)
      // 发送更新事件
      uni.$emit('tasks-updated', { taskId })
      return deletedTask
    } else {
      // 登录模式：从云端删除
      return await deleteCloudTask(taskId)
    }
  }
  
  /**
   * 获取单个任务详情
   * @param {String} taskId - 任务ID
   * @returns {Promise<Object>} 任务详情
   */
  const getTask = async (taskId) => {
    if (isGuest.value) {
      // 访客模式：从本地存储获取
      return await localManager.getTask(taskId)
    } else {
      // 登录模式：从云端获取
      return await getCloudTask(taskId)
    }
  }
  
  /**
   * 获取任务完整详情（包括子任务、父任务等）
   * @param {String} taskId - 任务ID
   * @returns {Promise<Object>} 完整任务详情
   */
  const getTaskDetail = async (taskId) => {
    if (isGuest.value) {
      // 访客模式：从本地存储获取完整详情
      return await localManager.getTaskDetail(taskId)
    } else {
      // 登录模式：从云端获取
      return await getCloudTaskDetail(taskId)
    }
  }
  
  /**
   * 批量更新任务状态
   * @param {Array} taskIds - 任务ID数组
   * @param {String} status - 新状态
   * @returns {Promise<Array>} 更新后的任务列表
   */
  const batchUpdateTaskStatus = async (taskIds, status) => {
    if (isGuest.value) {
      // 访客模式：批量更新本地存储
      const updatedTasks = await localManager.batchUpdateTaskStatus(taskIds, status)
      // 发送更新事件
      uni.$emit('tasks-updated')
      return updatedTasks
    } else {
      // 登录模式：批量更新云端数据
      return await batchUpdateCloudTaskStatus(taskIds, status)
    }
  }
  
  // =================== 云端数据操作方法 ===================
  
  // TodoBook云端操作
  const getCloudTodoBooks = async (options) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoBooks({
        include_archived: false,
        ...options
      })
      
      if (result.code === 0) {
        const books = result.data.list || result.data
        uni.$emit('todobooks-updated', books)
        return books
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('加载云端项目册失败:', error)
      throw error
    }
  }
  
  const createCloudTodoBook = async (bookData) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.createTodoBook(
        bookData.name,
        bookData.description,
        bookData.color,
        bookData.icon,
        bookData.tags
      )
      
      if (result.code === 0) {
        uni.$emit('todobooks-updated')
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('创建云端项目册失败:', error)
      throw error
    }
  }
  
  const updateCloudTodoBook = async (bookId, updateData) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.updateTodoBook(
        bookId,
        updateData.name,
        updateData.description,
        updateData.color,
        updateData.icon,
        updateData.tags
      )
      
      if (result.code === 0) {
        uni.$emit('todobooks-updated')
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('更新云端项目册失败:', error)
      throw error
    }
  }
  
  const deleteCloudTodoBook = async (bookId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.deleteTodoBook(bookId)
      
      if (result.code === 0) {
        uni.$emit('todobooks-updated')
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('删除云端项目册失败:', error)
      throw error
    }
  }
  
  const getCloudTodoBook = async (bookId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoBook(bookId)
      
      if (result.code === 0) {
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('获取云端项目册详情失败:', error)
      throw error
    }
  }
  
  // Task云端操作
  const getCloudTasks = async (bookId, options) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTasks(bookId, options)
      
      if (result.code === 0) {
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('获取云端任务列表失败:', error)
      throw error
    }
  }
  
  const createCloudTask = async (bookId, taskData) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.createTask(
        bookId,
        taskData.title,
        taskData.description,
        taskData.priority,
        taskData.tags,
        taskData.parent_id,
        taskData.expense_amount,
        taskData.actual_expense,
        taskData.payment_method,
        taskData.expense_description
      )
      
      if (result.code === 0) {
        uni.$emit('tasks-updated', { bookId })
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('创建云端任务失败:', error)
      throw error
    }
  }
  
  const updateCloudTask = async (taskId, updateData) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.updateTask(taskId, updateData)
      
      if (result.code === 0) {
        uni.$emit('tasks-updated', { taskId })
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('更新云端任务失败:', error)
      throw error
    }
  }
  
  const deleteCloudTask = async (taskId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.deleteTask(taskId)
      
      if (result.code === 0) {
        uni.$emit('tasks-updated', { taskId })
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('删除云端任务失败:', error)
      throw error
    }
  }
  
  const getCloudTask = async (taskId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTask(taskId)
      
      if (result.code === 0) {
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('获取云端任务详情失败:', error)
      throw error
    }
  }
  
  const getCloudTaskDetail = async (taskId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getTodoItemDetail(taskId)
      
      if (result.code === 0) {
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('获取云端任务完整详情失败:', error)
      throw error
    }
  }
  
  const batchUpdateCloudTaskStatus = async (taskIds, status) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.batchUpdateTaskStatus(taskIds, status)
      
      if (result.code === 0) {
        uni.$emit('tasks-updated')
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('批量更新云端任务状态失败:', error)
      throw error
    }
  }
  
  return {
    // TodoBook操作
    getTodoBooks,
    createTodoBook,
    updateTodoBook,
    deleteTodoBook,
    getTodoBook,
    
    // Task操作
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    getTaskDetail,
    batchUpdateTaskStatus,
    
    // 状态
    isGuest
  }
}