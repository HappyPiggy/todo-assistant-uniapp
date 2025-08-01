<template>
  <view class="todobook-form">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ pageTitle }}</text>
      <!-- 分享码导入快捷按钮 -->
      <view v-if="!isEditMode" class="import-shortcut" @click="handleImportShortcut">
        <uni-icons type="download" size="18" color="#007AFF"></uni-icons>
        <text class="import-shortcut-text">从分享码导入</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <LoadingState v-if="isEditMode && bookLoading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-else-if="isEditMode && bookError" 
      :message="bookError"
      @retry="loadBookData" />

    <!-- 表单 -->
    <BookForm
      v-else-if="!isEditMode || (bookData && Object.keys(bookData).length > 0 && !bookLoading)"
      :form-data="formData"
      :stats-data="statsData"
      :loading="submitting"
      :errors="errors"
      :show-preview="isEditMode"
      :mode="isEditMode ? 'edit' : 'create'"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

  </view>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import LoadingState from '@/pages/todobooks/components/common/LoadingState.vue'
import ErrorState from '@/pages/todobooks/components/common/ErrorState.vue'
import BookForm from '@/pages/todobooks/components/book/BookForm.vue'
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { BOOK_CONSTANTS } from '@/pages/todobooks/utils/constants.js'
import { onLoad, onShow } from '@dcloudio/uni-app'

let bookId = null
const hasInitialized = ref(false)

// 计算属性
const isEditMode = computed(() => !!bookId)
const pageTitle = computed(() => isEditMode.value ? '编辑项目册' : '创建项目册')

// 使用组合函数
const {
  bookData,
  loading: bookLoading,
  error: bookError,
  memberCount,
  loadBookDetail,
  createTodoBook,
  updateTodoBook
} = useBookData()

// 表单数据管理（原 useBookForm 逻辑）
const formData = reactive({
  title: '',
  description: '',
  color: BOOK_CONSTANTS.DEFAULT_COLOR,
  icon: BOOK_CONSTANTS.DEFAULT_ICON
})

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

// 表单验证函数
const validateForm = (data) => {
  const newErrors = {}
  
  // 验证项目册名称
  if (!data.title || data.title.trim() === '') {
    newErrors.title = '项目册名称不能为空'
  } else if (data.title.length > 100) {
    newErrors.title = '项目册名称不能超过100个字符'
  }
  
  // 验证描述（可选字段）
  if (data.description && data.description.length > 500) {
    newErrors.description = '项目描述不能超过500个字符'
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// 计算统计数据
const statsData = computed(() => {
  if (!isEditMode.value || !bookData.value) return null
  
  return {
    item_count: bookData.value.item_count || 0,
    completed_count: bookData.value.completed_count || 0,
    member_count: memberCount.value || 1
  }
})

onLoad((options) => {
  console.log("onLoad options", JSON.stringify(options, null, 2))
  if (options && options.id) {
    bookId = options.id
    loadBookData()
  }
})

onShow(() => {
  // 如果页面已经初始化过，并且是编辑模式，则刷新数据
  if (hasInitialized.value && isEditMode.value) {
    loadBookData()
  }
})

// 加载数据（仅编辑模式）
const loadBookData = async () => {
  if (!isEditMode.value) return
  
  await loadBookDetail(bookId)
  console.log('loadBookDetail 完成，bookData.value:', bookId, JSON.stringify(bookData.value, null, 2))
  
  // 加载完成后初始化表单数据
  if (bookData.value && Object.keys(bookData.value).length > 0) {
    fillForm(bookData.value)
  } else {
    console.log('bookData 为空，无法填充表单')
  }
}


// 事件处理
const handleSubmit = async (data) => {
  console.log('handleSubmit 开始, 当前 submitting 状态:', submitting.value)
  
  if (submitting.value) {
    console.log('防止重复提交，直接返回')
    return
  }
  
  // 表单验证
  if (!validateForm(data)) {
    console.log('表单验证失败:', errors.value)
    const errorMessages = Object.values(errors.value)
    uni.showToast({
      title: errorMessages[0] || '请检查输入信息',
      icon: 'none'
    })
    return
  }
  console.log('表单验证通过')
  
  try {
    console.log('设置 submitting 为 true')
    submitting.value = true
    
    let result
    if (isEditMode.value) {
      // 编辑模式：清理数据，避免循环引用
      const cleanData = {
        title: data.title,
        description: data.description,
        color: data.color,
        icon: data.icon
      }
      result = await updateTodoBook(bookId, cleanData)
    } else {
      // 创建模式
      result = await createTodoBook(data)
    }
    
    console.log('操作返回结果:', JSON.stringify(result, null, 2))
    
    if (result) {
      uni.showToast({
        title: isEditMode.value ? '保存成功' : '创建成功',
        icon: 'success'
      })
      
      // 返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    } else {
      throw new Error(isEditMode.value ? '保存失败' : '创建失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    uni.showToast({
      title: error.message || (isEditMode.value ? '保存失败' : '创建失败'),
      icon: 'none'
    })
  } finally {
    console.log('设置 submitting 为 false')
    submitting.value = false
  }
}

const handleCancel = () => {
  if (isEditMode.value) {
    // 编辑模式：检查是否有未保存的更改
    const hasChanges = bookData.value && (
      formData.title !== bookData.value.title ||
      formData.description !== bookData.value.description ||
      formData.color !== bookData.value.color ||
      formData.icon !== bookData.value.icon
    )
    
    if (hasChanges) {
      uni.showModal({
        title: '确认退出',
        content: '退出后将丢失未保存的更改，确定要退出吗？',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack()
          }
        }
      })
    } else {
      uni.navigateBack()
    }
  } else {
    // 创建模式：检查是否有输入内容
    if (formData.title || formData.description) {
      uni.showModal({
        title: '确认退出',
        content: '退出后将丢失已编辑的内容，确定要退出吗？',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack()
          }
        }
      })
    } else {
      uni.navigateBack()
    }
  }
}

// 处理分享码导入快捷按钮点击
const handleImportShortcut = () => {
  uni.navigateTo({
    url: '/pages/settings/share-management'
  })
}

// 生命周期
onMounted(() => {
  hasInitialized.value = true
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';
@import '@/pages/todobooks/styles/mixins.scss';

.todobook-form {
  min-height: 100vh;
  background-color: $bg-secondary;
  padding-bottom: $safe-area-bottom;
}

.page-header {
  @include card-style(0);
  padding: $padding-lg $padding-base;
  margin-bottom: $margin-base;
  background-color: $bg-white;
  border-bottom: 1rpx solid $border-color-light;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-title {
  font-size: $font-size-xxl;
  color: $text-primary;
  font-weight: $font-weight-bold;
  text-align: center;
}

.import-shortcut {
  position: absolute;
  right: $padding-base;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 16rpx;
  background-color: rgba(0, 122, 255, 0.1);
  border-radius: 20rpx;
  border: 1rpx solid rgba(0, 122, 255, 0.2);
  transition: all 0.3s ease;
  
  &:active {
    background-color: rgba(0, 122, 255, 0.2);
    transform: scale(0.95);
  }
}

.import-shortcut-text {
  font-size: $font-size-sm;
  color: #007AFF;
  font-weight: $font-weight-medium;
}
</style>