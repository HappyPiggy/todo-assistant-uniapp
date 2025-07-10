import { ref, reactive, computed } from 'vue'
import { BOOK_CONSTANTS, VALIDATION_RULES } from '@/pages/todobooks/utils/constants.js'
import { 
  getColorOptions, 
  getIconOptions, 
  formatBookDataForSubmit,
  hasBookFormChanges
} from '@/pages/todobooks/utils/bookUtils.js'
import globalStore from '@/store/index.js'

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
  
  
  const hasChanges = computed(() => {
    return hasBookFormChanges(formData, initialData)
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
      // 使用全局store创建项目册
      const result = await globalStore.todoBook.createTodoBook(data)
      
      return {
        success: true,
        data: result
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
      // 使用全局store更新项目册
      const result = await globalStore.todoBook.updateTodoBook(bookId, data)
      
      return {
        success: true,
        data: result
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
    hasChanges,
    
    // 方法
    selectColor,
    selectIcon,
    clearFieldError,
    clearErrors,
    resetForm,
    fillForm,
    getSubmitData,
    handleCancel,
    saveBook,
    updateBook,
    watchField
  }
}