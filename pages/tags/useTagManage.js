import { ref, reactive, computed, onMounted } from 'vue'
import { currentUserId } from '@/store/storage.js'
import { tagService } from '@/pages/tasks/composables/useTagService.js'

export const useTagManage = () => {
  // 响应式数据
  const taskId = ref('')
  const bookId = ref('')
  const currentTags = ref([])
  const selectedTags = ref([])
  const availableTags = ref([])
  
  // 编辑相关状态
  const isEditMode = ref(false)
  const editingTag = ref(null)
  const editModalVisible = ref(false)
  
  // 删除确认相关状态
  const deleteConfirmVisible = ref(false)
  const deletingTag = ref(null)
  const dependencyCount = ref(0)
  const dependencyTasks = ref([])
  
  const formData = reactive({
    name: '',
    color: '#007AFF'
  })
  
  const colorOptions = [
    { name: '蓝色', value: '#007AFF' },
    { name: '绿色', value: '#28a745' },
    { name: '红色', value: '#dc3545' },
    { name: '橙色', value: '#fd7e14' },
    { name: '紫色', value: '#6f42c1' },
    { name: '青色', value: '#17a2b8' },
    { name: '粉色', value: '#e83e8c' },
    { name: '黄色', value: '#ffc107' },
    { name: '深绿', value: '#198754' },
    { name: '深蓝', value: '#0d6efd' },
    { name: '深紫', value: '#8031a8' },
    { name: '深灰', value: '#6c757d' }
  ]
  
  const rules = {
    name: {
      rules: [
        { required: true, errorMessage: '请输入标签名称' },
        { minLength: 1, maxLength: 5, errorMessage: '标签名称应为1-5个字符' }
      ]
    }
  }
  
  // 计算属性
  const canCreate = computed(() => {
    return formData.name.trim().length > 0 && formData.color
  })
  
  // 方法
  const getCurrentUserId = () => {
    return currentUserId.value || 'current_user'
  }

  /**
   * 加载 TodoBook 的任务数据并提取标签（使用缓存）
   * @returns {Promise<Array>} 从任务中提取的标签列表
   */
  const loadTaskTags = async () => {
    if (!bookId.value) {
      console.log('没有 bookId，无法加载任务标签')
      return []
    }
    
    try {
      // 使用标签服务获取标签，带缓存功能
      const tags = await tagService.getBookTags(bookId.value)
      console.log('通过标签服务获取到标签:', tags.length, '个')
      return tags
    } catch (error) {
      console.error('加载任务标签失败:', error)
      return []
    }
  }
  
  const loadAvailableTags = async () => {
    try {
      console.log('开始加载可用标签...')
      
      // 1. 从本地存储加载用户创建的标签
      const storedTags = uni.getStorageSync(`user_tags_${getCurrentUserId()}`) || []
      console.log('本地存储标签:', storedTags.length, '个')
      
      // 2. 从任务中提取标签
      const taskTags = await loadTaskTags()
      console.log('任务中的标签:', taskTags.length, '个')
      
      // 3. 合并标签（去重）
      const allTagsMap = new Map()
      
      // 先添加本地存储的标签
      storedTags.forEach(tag => {
        if (tag.id && tag.name) {
          allTagsMap.set(tag.id, {
            id: tag.id,
            name: tag.name,
            color: tag.color || '#007AFF',
            createdAt: tag.createdAt || new Date().toISOString(),
            source: 'local' // 标记来源
          })
        }
      })
      
      // 再添加任务中的标签（如果本地没有同名标签）
      taskTags.forEach(tag => {
        if (tag.id && tag.name) {
          // 检查是否已存在相同名称的标签
          const existingTag = Array.from(allTagsMap.values()).find(t => t.name === tag.name)
          if (!existingTag) {
            allTagsMap.set(tag.id, {
              ...tag,
              source: 'task' // 标记来源
            })
          } else if (existingTag.source === 'task' && tag.color !== '#007AFF') {
            // 如果都是任务中的标签，但新的有颜色信息，则更新
            allTagsMap.set(existingTag.id, {
              ...existingTag,
              color: tag.color
            })
          }
        }
      })
      
      // 转换为数组并排序
      availableTags.value = Array.from(allTagsMap.values())
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
      
      console.log('合并后的可用标签:', availableTags.value.length, '个')
      
      // 4. 处理当前任务的标签，确保它们都在可用标签列表中
      currentTags.value.forEach(tag => {
        if (typeof tag === 'object' && tag.name) {
          // 查找匹配的标签
          let existingTag = availableTags.value.find(t => t.id === tag.id) ||
                           availableTags.value.find(t => t.name === tag.name && t.color === tag.color) ||
                           availableTags.value.find(t => t.name === tag.name)
          
          if (!existingTag) {
            // 如果找不到匹配的标签，创建新标签并添加到列表
            const newTag = {
              id: tag.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: tag.name,
              color: tag.color || '#007AFF',
              createdAt: tag.createdAt || new Date().toISOString(),
              source: 'current_task'
            }
            availableTags.value.push(newTag)
            availableTags.value.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
          } else if (!tag.id && existingTag.id) {
            // 更新当前标签的 id 引用
            tag.id = existingTag.id
          }
        }
      })
      
      // 5. 初始化选中状态（当前任务已有的标签）
      selectedTags.value = currentTags.value.map(tag => {
        if (typeof tag === 'string') {
          // 处理旧格式的字符串标签
          const existingTag = availableTags.value.find(t => t.name === tag)
          return existingTag ? existingTag.id : null
        } else if (typeof tag === 'object' && tag.name) {
          // 新格式的标签对象
          const existingTag = availableTags.value.find(t => t.id === tag.id) ||
                             availableTags.value.find(t => t.name === tag.name && t.color === tag.color) ||
                             availableTags.value.find(t => t.name === tag.name)
          return existingTag ? existingTag.id : null
        }
        return null
      }).filter(id => id !== null)
      
    } catch (error) {
      console.error('加载标签失败:', error)
      availableTags.value = []
      selectedTags.value = []
    }
  }
  
  const selectColor = (color) => {
    formData.color = color
  }
  
  const createTag = async (formRef) => {
    try {
      await formRef.validate()
    } catch (errors) {
      console.log('表单验证失败:', errors)
      return
    }

    const newTag = {
      id: Date.now().toString(), // 简单的ID生成
      name: formData.name.trim(),
      color: formData.color,
      createdAt: new Date().toISOString()
    }

    // 检查是否重名
    if (availableTags.value.some(tag => tag.name === newTag.name)) {
      uni.showToast({
        title: '标签名称已存在',
        icon: 'error'
      })
      return
    }

    // 添加到列表
    availableTags.value.push(newTag)
    
    // 保存到本地存储
    try {
      uni.setStorageSync(`user_tags_${getCurrentUserId()}`, availableTags.value)
      
      // 清空表单
      formData.name = ''
      formData.color = '#007AFF'
      
      uni.showToast({
        title: '标签创建成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('保存标签失败:', error)
      uni.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  }
  
  const toggleTagSelection = (tag) => {
    const index = selectedTags.value.indexOf(tag.id)
    if (index > -1) {
      selectedTags.value.splice(index, 1)
    } else {
      // 检查是否超过5个标签的限制
      if (selectedTags.value.length >= 5) {
        uni.showToast({
          title: '最多只能选择5个标签',
          icon: 'none',
          duration: 2000
        })
        return
      }
      selectedTags.value.push(tag.id)
    }
  }
  
  // 编辑功能
  const startEditTag = (tag) => {
    if (!tag) return
    
    editingTag.value = { ...tag }
    editModalVisible.value = true
    isEditMode.value = true
  }
  
  const cancelEditTag = () => {
    editingTag.value = null
    editModalVisible.value = false
    isEditMode.value = false
  }
  
  const saveTagEdit = async (updatedTag) => {
    if (!updatedTag || !editingTag.value) {
      console.error('saveTagEdit: 缺少必要参数')
      uni.showToast({
        title: '参数错误',
        icon: 'error'
      })
      return
    }
    
    try {
      // 更新标签在列表中的位置
      const tagIndex = availableTags.value.findIndex(tag => tag.id === editingTag.value.id)
      if (tagIndex === -1) {
        throw new Error(`未找到ID为 ${editingTag.value.id} 的标签`)
      }
      
      // 备份原始数据用于回滚
      const originalTag = { ...availableTags.value[tagIndex] }
      
      // 更新标签数据
      availableTags.value[tagIndex] = { ...updatedTag }
      
      try {
        // 保存到本地存储
        const userTags = availableTags.value.filter(tag => tag.source === 'local')
        uni.setStorageSync(`user_tags_${getCurrentUserId()}`, userTags)
        
        // 清理相关缓存
        if (bookId.value) {
          tagService.clearBookCache(bookId.value)
        }
        
        // 触发页面更新事件
        uni.$emit('tag-updated', updatedTag)
        
        // 显示成功提示
        uni.showToast({
          title: '标签修改成功',
          icon: 'success'
        })
        
        // 重置编辑状态（放在最后，确保模态组件能正确关闭）
        cancelEditTag()
        
        console.log('标签编辑成功:', updatedTag.name)
        
      } catch (storageError) {
        // 存储失败时回滚数据
        availableTags.value[tagIndex] = originalTag
        console.error('保存标签到本地存储失败:', storageError)
        uni.showToast({
          title: '保存失败，请检查存储空间',
          icon: 'error'
        })
        throw storageError
      }
      
    } catch (error) {
      console.error('保存标签编辑失败:', error)
      
      // 根据错误类型显示不同提示
      let errorMessage = '保存失败，请重试'
      if (error.message && error.message.includes('未找到')) {
        errorMessage = '标签已被删除或不存在'
      } else if (error.message && error.message.includes('存储')) {
        errorMessage = '存储空间不足，请清理后重试'
      }
      
      uni.showToast({
        title: errorMessage,
        icon: 'error'
      })
      
      throw error
    }
  }
  
  // 智能删除功能
  const checkTagDependencies = async (tagId) => {
    if (!bookId.value || !tagId) return 0
    
    try {
      // 使用tagService的新方法获取标签使用情况
      const count = await tagService.getTagUsageCount(bookId.value, tagId)
      const taskTitles = await tagService.getTasksUsingTag(bookId.value, tagId)
      
      // 限制显示的任务标题数量
      dependencyTasks.value = taskTitles.slice(0, 5)
      
      return count
    } catch (error) {
      console.error('检查标签依赖失败:', error)
      return 0
    }
  }
  
  const startDeleteTag = async (tag) => {
    if (!tag) return
    
    try {
      deletingTag.value = tag
      dependencyCount.value = await checkTagDependencies(tag.id)
      deleteConfirmVisible.value = true
    } catch (error) {
      console.error('准备删除标签失败:', error)
      uni.showToast({
        title: '检查标签使用情况失败',
        icon: 'error'
      })
    }
  }
  
  const confirmDeleteTag = async (tagId) => {
    if (!tagId) {
      console.error('confirmDeleteTag: tagId 为空')
      uni.showToast({
        title: '删除失败：标签ID无效',
        icon: 'error'
      })
      return
    }
    
    try {
      // 查找要删除的标签
      const index = availableTags.value.findIndex(t => t.id === tagId)
      if (index === -1) {
        uni.showToast({
          title: '标签不存在或已被删除',
          icon: 'error'
        })
        cancelDeleteTag()
        return
      }
      
      // 备份要删除的标签数据（用于回滚）
      const deletedTag = { ...availableTags.value[index] }
      const selectedIndex = selectedTags.value.indexOf(tagId)
      
      // 执行删除操作
      availableTags.value.splice(index, 1)
      
      // 从选中列表中移除
      if (selectedIndex > -1) {
        selectedTags.value.splice(selectedIndex, 1)
      }
      
      try {
        // 保存到本地存储（只保存用户创建的标签）
        const userTags = availableTags.value.filter(tag => tag.source === 'local')
        uni.setStorageSync(`user_tags_${getCurrentUserId()}`, userTags)
        
        // 清理相关缓存
        if (bookId.value) {
          tagService.clearBookCache(bookId.value)
        }
        
        // 重置删除状态
        cancelDeleteTag()
        
        // 触发页面更新事件
        uni.$emit('tag-deleted', tagId)
        
        uni.showToast({
          title: '删除成功',
          icon: 'success'
        })
        
        console.log('标签删除成功:', tagId)
        
      } catch (storageError) {
        // 存储失败时回滚数据
        availableTags.value.splice(index, 0, deletedTag)
        if (selectedIndex > -1) {
          selectedTags.value.splice(selectedIndex, 0, tagId)
        }
        
        console.error('保存删除操作到本地存储失败:', storageError)
        uni.showToast({
          title: '删除失败：存储错误',
          icon: 'error'
        })
        throw storageError
      }
      
    } catch (error) {
      console.error('删除标签失败:', error)
      
      // 根据错误类型显示不同提示
      let errorMessage = '删除失败，请重试'
      if (error.message && error.message.includes('存储')) {
        errorMessage = '存储操作失败，请重试'
      } else if (error.message && error.message.includes('网络')) {
        errorMessage = '网络错误，请检查网络连接'
      }
      
      uni.showToast({
        title: errorMessage,
        icon: 'error'
      })
      
      // 确保删除状态被重置
      cancelDeleteTag()
      
      throw error
    }
  }
  
  const cancelDeleteTag = () => {
    deletingTag.value = null
    dependencyCount.value = 0
    dependencyTasks.value = []
    deleteConfirmVisible.value = false
  }
  
  // 保持原有的deleteTag方法作为简单删除的备用方案
  const deleteTag = async (tag) => {
    // 使用新的智能删除流程
    await startDeleteTag(tag)
  }
  
  // 缓存管理
  const clearTagCaches = () => {
    if (bookId.value) {
      tagService.clearBookCache(bookId.value)
    }
  }
  
  const confirmSelection = () => {
    if (selectedTags.value.length === 0) {
      uni.showToast({
        title: '请选择标签',
        icon: 'error'
      })
      return
    }

    // 构造选中的标签数据，添加空值检查
    const selectedTagData = selectedTags.value.map(tagId => {
      const tag = availableTags.value.find(t => t.id === tagId)
      return tag ? {
        id: tag.id,
        name: tag.name,
        color: tag.color
      } : null
    }).filter(Boolean) // 过滤掉无效的标签

    // 如果过滤后没有有效标签，提示用户
    if (selectedTagData.length === 0) {
      uni.showToast({
        title: '选中的标签无效，请重新选择',
        icon: 'error'
      })
      return
    }

    // 通过事件传递数据给上一页
    uni.$emit('updateTags', selectedTagData)

    uni.navigateBack()
  }
  
  const cancel = () => {
    uni.navigateBack()
  }
  
  const initializeData = (options) => {
    
    if (options.taskId) {
      taskId.value = options.taskId
    }
    if (options.bookId) {
      bookId.value = options.bookId
    }
    if (options.currentTags) {
      try {
        const decodedTags = decodeURIComponent(options.currentTags)
        currentTags.value = JSON.parse(decodedTags)
      } catch (error) {
        console.error('解析当前标签失败:', error, '原始数据:', options.currentTags)
        currentTags.value = []
      }
    } else {
      // 确保 currentTags 被初始化
      currentTags.value = []
      console.log('未传递 currentTags 参数，初始化为空数组')
    }
    
    loadAvailableTags()
  }
  
  return {
    // 响应式数据
    taskId,
    bookId,
    currentTags,
    selectedTags,
    availableTags,
    formData,
    colorOptions,
    rules,
    
    // 编辑相关状态
    isEditMode,
    editingTag,
    editModalVisible,
    
    // 删除确认相关状态
    deleteConfirmVisible,
    deletingTag,
    dependencyCount,
    dependencyTasks,
    
    // 计算属性
    canCreate,
    
    // 方法
    initializeData,
    loadAvailableTags,
    loadTaskTags,
    selectColor,
    createTag,
    toggleTagSelection,
    deleteTag,
    confirmSelection,
    cancel,
    
    // 编辑功能
    startEditTag,
    cancelEditTag,
    saveTagEdit,
    
    // 智能删除功能
    startDeleteTag,
    confirmDeleteTag,
    cancelDeleteTag,
    checkTagDependencies,
    
    // 缓存管理
    clearTagCaches
  }
}