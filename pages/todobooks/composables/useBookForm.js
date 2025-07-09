import { ref, reactive, computed } from 'vue'
import { BOOK_CONSTANTS, VALIDATION_RULES } from '../utils/constants.js'
import { 
  getColorOptions, 
  getIconOptions, 
  validateBookForm, 
  formatBookDataForSubmit,
  hasBookFormChanges,
  generateBookPreview
} from '../utils/bookUtils.js'

/**
 * 项目册表单管理组合式函数
 * @param {Object} initialData - 初始数据
 * @returns {Object} 表单数据和操作方法
 */
export function useBookForm(initialData = null) {
  // 响应式表单数据
  const formData = reactive({
    title: '',
    description: '',
    color: BOOK_CONSTANTS.DEFAULT_COLOR,
    icon: BOOK_CONSTANTS.DEFAULT_ICON,
    ...initialData
  })
  
  // 表单状态
  const submitting = ref(false)
  const errors = ref({})
  
  // 选项数据
  const colorOptions = ref(getColorOptions())
  const iconOptions = ref(getIconOptions())
  
  // 表单验证规则
  const rules = ref(VALIDATION_RULES.BOOK_FORM)
  
  // 计算属性
  const isValid = computed(() => {
    const validation = validateBookForm(formData)
    return validation.isValid
  })
  
  const hasChanges = computed(() => {
    return hasBookFormChanges(formData, initialData)
  })
  
  const previewData = computed(() => {
    return generateBookPreview(formData)
  })
  
  /**
   * 选择颜色
   * @param {string} color - 颜色值
   */
  const selectColor = (color) => {
    formData.color = color
    // 清除颜色相关错误
    if (errors.value.color) {
      delete errors.value.color
    }
  }
  
  /**
   * 选择图标
   * @param {string} icon - 图标值
   */
  const selectIcon = (icon) => {
    formData.icon = icon
    // 清除图标相关错误
    if (errors.value.icon) {
      delete errors.value.icon
    }
  }
  
  /**
   * 验证表单
   * @returns {boolean} 是否通过验证
   */
  const validateForm = () => {
    const validation = validateBookForm(formData)
    errors.value = validation.errors
    return validation.isValid
  }
  
  /**
   * 清除特定字段错误
   * @param {string} field - 字段名
   */
  const clearFieldError = (field) => {
    if (errors.value[field]) {
      delete errors.value[field]
    }
  }
  
  /**
   * 清除所有错误
   */
  const clearErrors = () => {
    errors.value = {}
  }
  
  /**
   * 重置表单
   * @param {Object} data - 重置数据
   */
  const resetForm = (data = null) => {
    const resetData = data || {
      title: '',
      description: '',
      color: BOOK_CONSTANTS.DEFAULT_COLOR,
      icon: BOOK_CONSTANTS.DEFAULT_ICON
    }
    
    Object.assign(formData, resetData)
    clearErrors()
  }
  
  /**
   * 填充表单数据
   * @param {Object} data - 填充数据
   */
  const fillForm = (data) => {
    if (data) {
      formData.title = data.title || ''
      formData.description = data.description || ''
      formData.color = data.color || BOOK_CONSTANTS.DEFAULT_COLOR
      formData.icon = data.icon || BOOK_CONSTANTS.DEFAULT_ICON
    }
    clearErrors()
  }
  
  /**
   * 获取提交数据
   * @returns {Object} 格式化后的提交数据
   */
  const getSubmitData = () => {
    return formatBookDataForSubmit(formData)
  }
  
  /**
   * 处理表单提交
   * @param {Function} submitFn - 提交函数
   * @param {Object} options - 选项
   */
  const handleSubmit = async (submitFn, options = {}) => {
    const {
      showLoading = true,
      loadingText = '提交中...',
      successText = '提交成功',
      validate = true
    } = options
    
    // 验证表单
    if (validate && !validateForm()) {
      const firstError = Object.values(errors.value)[0]
      if (firstError) {
        uni.showToast({
          title: firstError,
          icon: 'none'
        })
      }
      return false
    }
    
    submitting.value = true
    
    if (showLoading) {
      uni.showLoading({
        title: loadingText
      })
    }
    
    try {
      const submitData = getSubmitData()
      const result = await submitFn(submitData)
      
      if (showLoading) {
        uni.hideLoading()
      }
      
      uni.showToast({
        title: successText,
        icon: 'success'
      })
      
      return result
    } catch (error) {
      if (showLoading) {
        uni.hideLoading()
      }
      
      console.error('表单提交失败:', error)
      uni.showToast({
        title: error.message || '提交失败',
        icon: 'error'
      })
      
      throw error
    } finally {
      submitting.value = false
    }
  }
  
  /**
   * 处理取消操作
   * @param {Object} options - 选项
   */
  const handleCancel = (options = {}) => {
    const {
      confirmMessage = '确定要取消吗？已输入的内容将丢失。',
      showConfirm = true
    } = options
    
    const cancel = () => {
      uni.navigateBack()
    }
    
    if (showConfirm && hasChanges.value) {
      uni.showModal({
        title: '确认取消',
        content: confirmMessage,
        success: (res) => {
          if (res.confirm) {
            cancel()
          }
        }
      })
    } else {
      cancel()
    }
  }
  
  /**
   * 保存项目册（创建）
   * @param {Object} data - 表单数据
   * @returns {Promise} 创建结果
   */
  const saveBook = async (data) => {
    try {
      const result = await uniCloud.callFunction({
        name: 'todobook-co',
        data: {
          action: 'createTodoBook',
          ...data
        }
      })
      
      if (result.result.success) {
        return result.result
      } else {
        throw new Error(result.result.message || '创建失败')
      }
    } catch (error) {
      console.error('创建项目册失败:', error)
      throw error
    }
  }
  
  /**
   * 更新项目册
   * @param {string} bookId - 项目册ID
   * @param {Object} data - 表单数据
   * @returns {Promise} 更新结果
   */
  const updateBook = async (bookId, data) => {
    try {
      const result = await uniCloud.callFunction({
        name: 'todobook-co',
        data: {
          action: 'updateTodoBook',
          todobook_id: bookId,
          ...data
        }
      })
      
      if (result.result.success) {
        return result.result
      } else {
        throw new Error(result.result.message || '更新失败')
      }
    } catch (error) {
      console.error('更新项目册失败:', error)
      throw error
    }
  }
  
  /**
   * 监听字段变化
   * @param {string} field - 字段名
   * @param {Function} callback - 回调函数
   */
  const watchField = (field, callback) => {
    // 在Vue 3中，可以使用watch来监听响应式对象的属性
    // 这里简化处理，实际项目中可以使用watch API
    const originalValue = formData[field]
    Object.defineProperty(formData, field, {
      get() {
        return originalValue
      },
      set(newValue) {
        originalValue = newValue
        callback(newValue, originalValue)
      }
    })
  }
  
  return {
    // 响应式数据
    formData,
    submitting,
    errors,
    colorOptions,
    iconOptions,
    rules,
    
    // 计算属性
    isValid,
    hasChanges,
    previewData,
    
    // 方法
    selectColor,
    selectIcon,
    validateForm,
    clearFieldError,
    clearErrors,
    resetForm,
    fillForm,
    getSubmitData,
    handleSubmit,
    handleCancel,
    saveBook,
    updateBook,
    watchField
  }
}