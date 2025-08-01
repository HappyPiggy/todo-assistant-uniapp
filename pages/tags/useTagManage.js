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
  const editingTag = ref({})
  const editTagName = ref('')
  
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
  
  const editTag = (tag, editPopupRef) => {
    editingTag.value = tag
    editTagName.value = tag.name
    editPopupRef.open()
  }
  
  const saveEditTag = async (newName) => {
    const trimmedName = newName.trim()
    if (!trimmedName || trimmedName.length > 5) {
      uni.showToast({
        title: '标签名称格式错误',
        icon: 'error'
      })
      return
    }

    // 检查重名
    if (availableTags.value.some(tag => tag.id !== editingTag.value.id && tag.name === trimmedName)) {
      uni.showToast({
        title: '标签名称已存在',
        icon: 'error'
      })
      return
    }

    // 更新标签
    const tagIndex = availableTags.value.findIndex(tag => tag.id === editingTag.value.id)
    if (tagIndex > -1) {
      availableTags.value[tagIndex].name = trimmedName
      
      // 保存到本地存储
      uni.setStorageSync(`user_tags_${getCurrentUserId()}`, availableTags.value)
      
      uni.showToast({
        title: '修改成功',
        icon: 'success'
      })
    }
    
    closeEditDialog()
  }
  
  const deleteTag = (tag) => {
    uni.showModal({
      title: '确认删除',
      content: `确定要删除标签"${tag.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          // 从列表中移除
          const index = availableTags.value.findIndex(t => t.id === tag.id)
          if (index > -1) {
            availableTags.value.splice(index, 1)
            
            // 从选中列表中移除
            const selectedIndex = selectedTags.value.indexOf(tag.id)
            if (selectedIndex > -1) {
              selectedTags.value.splice(selectedIndex, 1)
            }
            
            // 保存到本地存储
            uni.setStorageSync(`user_tags_${getCurrentUserId()}`, availableTags.value)
            
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
          }
        }
      }
    })
  }
  
  const closeEditDialog = (editPopupRef) => {
    if (editPopupRef) {
      editPopupRef.close()
    }
    editingTag.value = {}
    editTagName.value = ''
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
    editingTag,
    editTagName,
    formData,
    colorOptions,
    rules,
    
    // 计算属性
    canCreate,
    
    // 方法
    initializeData,
    loadAvailableTags,
    loadTaskTags,
    selectColor,
    createTag,
    toggleTagSelection,
    editTag,
    saveEditTag,
    deleteTag,
    closeEditDialog,
    confirmSelection,
    cancel
  }
}