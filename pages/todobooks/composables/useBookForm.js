import { ref, reactive } from 'vue'
import { BOOK_CONSTANTS } from '@/pages/todobooks/utils/constants.js'
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
    errors.value = {}
  }
  
  
  
  return {
    // 响应式数据
    formData,
    submitting,
    errors,
    
    // 方法
    fillForm
  }
}