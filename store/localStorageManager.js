// 本地存储管理器
// 用于管理访客模式下的本地数据存储
class LocalStorageManager {
  constructor() {
    this.STORAGE_KEY = 'guest_todobook_data'
    this.VERSION = '1.0.0'
    this.MAX_BOOKS = 1
    this.STORAGE_SIZE_LIMIT = 4 * 1024 * 1024 // 4MB，预留1MB给其他数据
    
    // 初始化数据结构
    this.initStorage()
  }
  
  // 初始化存储结构
  initStorage() {
    try {
      const existingData = this.getStorageData()
      if (!existingData || !this.isValidDataFormat(existingData)) {
        this.resetStorage()
      }
    } catch (error) {
      console.error('LocalStorage初始化失败:', error)
      this.resetStorage()
    }
  }
  
  // 重置存储为默认结构
  resetStorage() {
    const defaultData = {
      version: this.VERSION,
      lastModified: new Date().toISOString(),
      todobooks: [],
      tasks: []
    }
    this.saveStorageData(defaultData)
  }
  
  // 获取完整的存储数据
  getStorageData() {
    try {
      const data = uni.getStorageSync(this.STORAGE_KEY)
      return data ? JSON.parse(JSON.stringify(data)) : null
    } catch (error) {
      console.error('读取本地存储失败:', error)
      return null
    }
  }
  
  // 保存完整的存储数据
  saveStorageData(data) {
    try {
      // 检查存储容量
      if (!this.checkStorageQuota(data)) {
        throw new Error('存储空间不足')
      }
      
      data.lastModified = new Date().toISOString()
      uni.setStorageSync(this.STORAGE_KEY, data)
      
      // 触发跨标签页同步事件
      this.triggerStorageSync()
    } catch (error) {
      console.error('保存本地存储失败:', error)
      throw error
    }
  }
  
  // 检查存储容量
  checkStorageQuota(data) {
    try {
      const dataString = JSON.stringify(data)
      const sizeInBytes = new Blob([dataString]).size
      
      if (sizeInBytes > this.STORAGE_SIZE_LIMIT) {
        uni.showToast({
          title: '本地存储空间不足',
          icon: 'none',
          duration: 2000
        })
        return false
      }
      
      // 测试实际写入
      const testKey = '__test_storage_quota__'
      const testData = dataString
      uni.setStorageSync(testKey, testData)
      uni.removeStorageSync(testKey)
      
      return true
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        uni.showToast({
          title: '本地存储空间不足，请清理浏览器缓存或登录使用云端存储',
          icon: 'none',
          duration: 3000
        })
        return false
      }
      throw error
    }
  }
  
  // 验证数据格式
  isValidDataFormat(data) {
    if (!data || typeof data !== 'object') return false
    
    const requiredFields = ['version', 'lastModified', 'todobooks', 'tasks']
    const hasAllFields = requiredFields.every(field => field in data)
    
    if (!hasAllFields) return false
    
    // 验证数组格式
    if (!Array.isArray(data.todobooks) || !Array.isArray(data.tasks)) return false
    
    return true
  }
  
  // 生成本地ID
  generateLocalId(type) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `local_${type}_${timestamp}_${random}`
  }
  
  // 事务性操作封装
  async transactionalUpdate(operations) {
    const backup = this.getStorageData()
    let result = null
    try {
      for (const operation of operations) {
        result = await operation()
      }
      return result
    } catch (error) {
      // 回滚操作
      if (backup) {
        uni.setStorageSync(this.STORAGE_KEY, backup)
      }
      throw error
    }
  }
  
  // 触发存储同步事件（用于多标签页同步）
  triggerStorageSync() {
    // 发送自定义事件通知其他标签页
    try {
      // 使用uni-app的全局事件系统
      uni.$emit('local-storage-updated', {
        timestamp: Date.now(),
        key: this.STORAGE_KEY
      })
    } catch (error) {
      console.error('触发存储同步事件失败:', error)
    }
  }
  
  // 检查隐私模式或localStorage不可用
  isStorageAvailable() {
    try {
      const test = '__test_storage_available__'
      uni.setStorageSync(test, 'test')
      uni.removeStorageSync(test)
      return true
    } catch (error) {
      return false
    }
  }
  
  // 获取存储使用情况
  getStorageInfo() {
    try {
      const data = this.getStorageData()
      if (!data) return null
      
      const dataString = JSON.stringify(data)
      const sizeInBytes = new Blob([dataString]).size
      const sizeInKB = Math.round(sizeInBytes / 1024)
      
      return {
        totalBooks: data.todobooks.length,
        totalTasks: data.tasks.length,
        storageSize: sizeInKB,
        maxSize: Math.round(this.STORAGE_SIZE_LIMIT / 1024),
        lastModified: data.lastModified
      }
    } catch (error) {
      console.error('获取存储信息失败:', error)
      return null
    }
  }
  
  // 清理存储
  clearStorage() {
    try {
      uni.removeStorageSync(this.STORAGE_KEY)
      this.resetStorage()
    } catch (error) {
      console.error('清理存储失败:', error)
      throw error
    }
  }
  
  // =================== TodoBook相关操作 ===================
  
  // 获取所有TodoBook
  async getTodoBooks() {
    try {
      const data = this.getStorageData()
      if (!data) return []
      
      // 返回TodoBook列表，添加统计信息
      return data.todobooks.map(book => {
        const bookTasks = data.tasks.filter(task => task.todobook_id === book._id)
        const completedTasks = bookTasks.filter(task => task.status === 'completed')
        
        return {
          ...book,
          tasks_count: bookTasks.length,
          item_count: bookTasks.length, // 兼容性字段
          completed_count: completedTasks.length,
          is_local: true // 标识为本地数据
        }
      })
    } catch (error) {
      console.error('获取TodoBook列表失败:', error)
      throw error
    }
  }
  
  // 创建TodoBook
  async createTodoBook(bookData) {
    return this.transactionalUpdate([async () => {
      const data = this.getStorageData()
      
      // 检查数量限制
      if (data.todobooks.length >= this.MAX_BOOKS) {
        throw new Error('未登录用户最多只能创建1个项目册')
      }
      
      // 创建新的TodoBook
      const newBook = {
        _id: this.generateLocalId('book'),
        title: bookData.title || '新建项目册',
        description: bookData.description || '',
        color: bookData.color || '#4CAF50',
        icon: bookData.icon || '📝',
        tags: bookData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks_count: 0,
        item_count: 0, // 兼容性字段
        completed_count: 0,
        is_local: true
      }
      
      data.todobooks.push(newBook)
      this.saveStorageData(data)
      
      return newBook
    }])
  }
  
  // 更新TodoBook
  async updateTodoBook(bookId, updateData) {
    return this.transactionalUpdate([async () => {
      const data = this.getStorageData()
      
      const bookIndex = data.todobooks.findIndex(book => book._id === bookId)
      if (bookIndex === -1) {
        throw new Error('项目册不存在')
      }
      
      // 更新TodoBook数据
      const updatedBook = {
        ...data.todobooks[bookIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      }
      
      
      data.todobooks[bookIndex] = updatedBook
      this.saveStorageData(data)
      
      return updatedBook
    }])
  }
  
  // 删除TodoBook
  async deleteTodoBook(bookId) {
    return this.transactionalUpdate([async () => {
      const data = this.getStorageData()
      
      const bookIndex = data.todobooks.findIndex(book => book._id === bookId)
      if (bookIndex === -1) {
        throw new Error('项目册不存在')
      }
      
      // 删除TodoBook
      const deletedBook = data.todobooks[bookIndex]
      data.todobooks.splice(bookIndex, 1)
      
      // 删除相关的所有任务
      data.tasks = data.tasks.filter(task => task.todobook_id !== bookId)
      
      this.saveStorageData(data)
      
      return deletedBook
    }])
  }
  
  // 获取单个TodoBook详情
  async getTodoBook(bookId) {
    try {
      const books = await this.getTodoBooks()
      const book = books.find(b => b._id === bookId)
      
      if (!book) {
        throw new Error('项目册不存在')
      }
      
      return book
    } catch (error) {
      console.error('获取TodoBook详情失败:', error)
      throw error
    }
  }
  
  // =================== Task相关操作 ===================
  
  // 获取指定TodoBook的所有任务
  async getTasks(bookId, options = {}) {
    try {
      const data = this.getStorageData()
      if (!data) return []
      
      let tasks = data.tasks.filter(task => task.todobook_id === bookId)
      
      // 排序（按创建时间降序）
      tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      // 应用过滤器
      if (options.status) {
        tasks = tasks.filter(task => task.status === options.status)
      }
      
      if (options.priority) {
        tasks = tasks.filter(task => task.priority === options.priority)
      }
      
      return tasks.map(task => ({
        ...task,
        is_local: true
      }))
    } catch (error) {
      console.error('获取任务列表失败:', error)
      throw error
    }
  }
  
  // 创建任务
  async createTask(bookId, taskData) {
    return this.transactionalUpdate([async () => {
      const data = this.getStorageData()
      
      // 验证TodoBook是否存在
      const bookExists = data.todobooks.some(book => book._id === bookId)
      if (!bookExists) {
        throw new Error('项目册不存在')
      }
      
      // 创建新任务
      const newTask = {
        _id: this.generateLocalId('task'),
        todobook_id: bookId,
        title: taskData.title || '新任务',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        tags: taskData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parent_id: taskData.parent_id || null,
        due_date: taskData.due_date || null,
        estimated_hours: taskData.estimated_hours || 0,
        children: [],
        is_local: true,
        // 支付相关字段（如果有）
        budget: taskData.expense_amount || 0,
        actual_cost: taskData.actual_expense || 0,
        payment_method: taskData.payment_method || '',
        expense_description: taskData.expense_description || ''
      }
      
      data.tasks.push(newTask)
      
      // 如果是子任务，更新父任务
      if (newTask.parent_id) {
        const parentTask = data.tasks.find(task => task._id === newTask.parent_id)
        if (parentTask) {
          if (!parentTask.children) parentTask.children = []
          parentTask.children.push(newTask._id)
          parentTask.updated_at = new Date().toISOString()
        }
      }
      
      // 更新TodoBook统计信息
      this._updateBookStatistics(data, bookId)
      
      this.saveStorageData(data)
      return newTask
    }])
  }
  
  // 更新任务
  async updateTask(taskId, updateData) {
    return this.transactionalUpdate([async () => {
      const data = this.getStorageData()
      
      const taskIndex = data.tasks.findIndex(task => task._id === taskId)
      if (taskIndex === -1) {
        throw new Error('任务不存在')
      }
      
      const originalTask = data.tasks[taskIndex]
      
      // 更新任务数据
      const updatedTask = {
        ...originalTask,
        ...updateData,
        updated_at: new Date().toISOString()
      }
      
      // 如果状态发生变化，处理子任务状态
      if (updateData.status && updateData.status !== originalTask.status) {
        this._updateChildTasksStatus(data, taskId, updateData.status)
      }
      
      data.tasks[taskIndex] = updatedTask
      
      // 更新TodoBook统计信息
      this._updateBookStatistics(data, updatedTask.todobook_id)
      
      this.saveStorageData(data)
      
      return updatedTask
    }])
  }
  
  // 删除任务
  async deleteTask(taskId) {
    return this.transactionalUpdate([async () => {
      const data = this.getStorageData()
      
      const taskIndex = data.tasks.findIndex(task => task._id === taskId)
      if (taskIndex === -1) {
        throw new Error('任务不存在')
      }
      
      const taskToDelete = data.tasks[taskIndex]
      
      // 递归删除子任务
      if (taskToDelete.children && taskToDelete.children.length > 0) {
        for (const childId of taskToDelete.children) {
          await this._deleteTaskRecursive(data, childId)
        }
      }
      
      // 从父任务中移除引用
      if (taskToDelete.parent_id) {
        const parentTask = data.tasks.find(task => task._id === taskToDelete.parent_id)
        if (parentTask && parentTask.children) {
          parentTask.children = parentTask.children.filter(childId => childId !== taskId)
          parentTask.updated_at = new Date().toISOString()
        }
      }
      
      // 删除任务
      data.tasks.splice(taskIndex, 1)
      
      // 更新TodoBook统计信息
      this._updateBookStatistics(data, taskToDelete.todobook_id)
      
      this.saveStorageData(data)
      
      return taskToDelete
    }])
  }
  
  // 获取单个任务详情
  async getTask(taskId) {
    try {
      const data = this.getStorageData()
      if (!data) return null
      
      const task = data.tasks.find(task => task._id === taskId)
      if (!task) {
        throw new Error('任务不存在')
      }
      
      return {
        ...task,
        is_local: true
      }
    } catch (error) {
      console.error('获取任务详情失败:', error)
      throw error
    }
  }
  
  // 获取任务完整详情（包括子任务、父任务等）
  async getTaskDetail(taskId) {
    try {
      const data = this.getStorageData()
      if (!data) return null
      
      const task = data.tasks.find(task => task._id === taskId)
      if (!task) {
        throw new Error('任务不存在')
      }
      
      // 获取子任务
      const subtasks = data.tasks.filter(t => t.parent_id === taskId)
      
      // 获取父任务
      let parentTask = null
      if (task.parent_id) {
        parentTask = data.tasks.find(t => t._id === task.parent_id)
      }
      
      return {
        task: {
          ...task,
          is_local: true,
          subtask_count: subtasks.length,
          completed_subtask_count: subtasks.filter(t => t.status === 'completed').length
        },
        subtasks: subtasks.map(subtask => ({
          ...subtask,
          is_local: true
        })),
        parentTask: parentTask ? {
          ...parentTask,
          is_local: true
        } : null,
        assignee: null // 访客模式下没有负责人信息
      }
    } catch (error) {
      console.error('获取任务完整详情失败:', error)
      throw error
    }
  }
  
  // 批量更新任务状态
  async batchUpdateTaskStatus(taskIds, status) {
    return this.transactionalUpdate([async () => {
      const data = this.getStorageData()
      const updatedTasks = []
      
      for (const taskId of taskIds) {
        const taskIndex = data.tasks.findIndex(task => task._id === taskId)
        if (taskIndex !== -1) {
          data.tasks[taskIndex].status = status
          data.tasks[taskIndex].updated_at = new Date().toISOString()
          updatedTasks.push(data.tasks[taskIndex])
        }
      }
      
      // 更新相关TodoBook的统计信息
      const updatedBookIds = [...new Set(updatedTasks.map(task => task.todobook_id))]
      updatedBookIds.forEach(bookId => {
        this._updateBookStatistics(data, bookId)
      })
      
      this.saveStorageData(data)
      return updatedTasks
    }])
  }
  
  // =================== 私有辅助方法 ===================
  
  // 更新TodoBook统计信息
  _updateBookStatistics(data, bookId) {
    const bookIndex = data.todobooks.findIndex(book => book._id === bookId)
    if (bookIndex === -1) return
    
    const bookTasks = data.tasks.filter(task => task.todobook_id === bookId)
    const completedTasks = bookTasks.filter(task => task.status === 'completed')
    
    // 更新统计字段
    data.todobooks[bookIndex].tasks_count = bookTasks.length
    data.todobooks[bookIndex].item_count = bookTasks.length // 兼容性字段
    data.todobooks[bookIndex].completed_count = completedTasks.length
    data.todobooks[bookIndex].updated_at = new Date().toISOString()
  }
  
  // 递归删除子任务
  _deleteTaskRecursive(data, taskId) {
    const taskIndex = data.tasks.findIndex(task => task._id === taskId)
    if (taskIndex === -1) return
    
    const task = data.tasks[taskIndex]
    
    // 删除子任务的子任务
    if (task.children && task.children.length > 0) {
      for (const childId of task.children) {
        this._deleteTaskRecursive(data, childId)
      }
    }
    
    // 删除当前任务
    data.tasks.splice(taskIndex, 1)
  }
  
  // 更新子任务状态
  _updateChildTasksStatus(data, parentTaskId, newStatus) {
    const parentTask = data.tasks.find(task => task._id === parentTaskId)
    if (!parentTask || !parentTask.children) return
    
    for (const childId of parentTask.children) {
      const childTask = data.tasks.find(task => task._id === childId)
      if (childTask) {
        childTask.status = newStatus
        childTask.updated_at = new Date().toISOString()
        
        // 递归更新子任务的子任务
        this._updateChildTasksStatus(data, childId, newStatus)
      }
    }
  }
}

// 创建单例实例
let localStorageManagerInstance = null

export function useLocalStorageManager() {
  if (!localStorageManagerInstance) {
    localStorageManagerInstance = new LocalStorageManager()
  }
  return localStorageManagerInstance
}

export default LocalStorageManager