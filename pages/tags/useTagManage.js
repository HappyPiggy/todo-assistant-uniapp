import { ref, reactive, computed, onMounted } from 'vue'

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
    // 获取当前用户ID，这里使用简单的方法
    // 实际项目中应该从store或其他地方获取
    return 'current_user' // 临时方案
  }
  
  const loadAvailableTags = async () => {
    try {
      // 从本地存储加载标签
      const storedTags = uni.getStorageSync(`user_tags_${getCurrentUserId()}`) || []
      availableTags.value = [...storedTags]
      
      // 确保当前任务的标签都在可用标签列表中
      currentTags.value.forEach(tag => {
        if (typeof tag === 'object' && tag.name && tag.color) {
          // 先尝试通过 id 匹配
          let existingTag = null
          if (tag.id) {
            existingTag = availableTags.value.find(t => t.id === tag.id)
          }
          
          // 如果通过 id 找不到，尝试通过名称和颜色匹配
          if (!existingTag) {
            existingTag = availableTags.value.find(t => t.name === tag.name && t.color === tag.color)
          }
          
          // 如果还是找不到，尝试只通过名称匹配
          if (!existingTag) {
            existingTag = availableTags.value.find(t => t.name === tag.name)
          }
          
          if (!existingTag) {
            // 如果完全不存在，创建一个新的标签并添加到列表中
            const newTag = {
              id: tag.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: tag.name,
              color: tag.color,
              createdAt: tag.createdAt || new Date().toISOString()
            }
            availableTags.value.push(newTag)
          } else if (!tag.id && existingTag.id) {
            // 如果当前标签没有 id 但找到了匹配的标签，更新当前标签的 id
            tag.id = existingTag.id
          }
        }
      })
      
      // 初始化选中状态（当前任务已有的标签）
      selectedTags.value = currentTags.value.map(tag => {
        if (typeof tag === 'string') {
          // 处理旧格式的字符串标签
          const existingTag = availableTags.value.find(t => t.name === tag)
          return existingTag ? existingTag.id : null
        } else if (typeof tag === 'object' && tag.name) {
          // 新格式的标签对象
          let existingTag = null
          
          // 优先通过 id 匹配
          if (tag.id) {
            existingTag = availableTags.value.find(t => t.id === tag.id)
          }
          
          // 如果没有 id 或通过 id 找不到，尝试通过名称和颜色匹配
          if (!existingTag && tag.color) {
            existingTag = availableTags.value.find(t => t.name === tag.name && t.color === tag.color)
          }
          
          // 如果还是找不到，只通过名称匹配
          if (!existingTag) {
            existingTag = availableTags.value.find(t => t.name === tag.name)
          }
          
          return existingTag ? existingTag.id : null
        }
        return null
      }).filter(id => id !== null)
      
      console.log('当前标签:', JSON.stringify(currentTags.value, null, 2))
      console.log('可用标签:', JSON.stringify(availableTags.value, null, 2))
      console.log('选中标签ID:', JSON.stringify(selectedTags.value, null, 2))
      
      // 添加匹配过程的详细日志
      currentTags.value.forEach((tag, index) => {
        console.log(`标签 ${index} 匹配过程:`, {
          原始标签: tag,
          匹配结果: availableTags.value.find(t => t.name === tag.name)
        })
      })
      
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
    console.log('initializeData 接收到的参数:', JSON.stringify(options, null, 2))
    
    if (options.taskId) {
      taskId.value = options.taskId
    }
    if (options.bookId) {
      bookId.value = options.bookId
    }
    if (options.currentTags) {
      try {
        console.log('原始 currentTags 字符串:', options.currentTags)
        const decodedTags = decodeURIComponent(options.currentTags)
        console.log('解码后的字符串:', decodedTags)
        currentTags.value = JSON.parse(decodedTags)
        console.log('解析后的标签数据:', JSON.stringify(currentTags.value, null, 2))
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