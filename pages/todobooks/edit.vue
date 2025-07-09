<template>
  <view class="edit-todobook">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">编辑项目册</text>
    </view>

    <!-- 加载状态 -->
    <LoadingState v-if="bookLoading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-else-if="bookError" 
      :message="bookError"
      @retry="loadBookData" />

    <!-- 编辑表单 -->
    <BookForm
      v-else-if="bookData && !bookLoading"
      :form-data="formData"
      :stats-data="bookData"
      :loading="submitting"
      :errors="errors"
      :show-preview="true"
      mode="edit"
      @submit="handleSubmit"
      @cancel="handleCancel"
      @update:form-data="updateFormData"
    />

  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LoadingState from './components/common/LoadingState.vue'
import ErrorState from './components/common/ErrorState.vue'
import BookForm from './components/book/BookForm.vue'
import { useBookForm } from './composables/useBookForm.js'
import { useBookData } from './composables/useBookData.js'

// 获取路由参数
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]
const bookId = currentPage.options.id

// 使用组合函数
const {
  bookData,
  loading: bookLoading,
  error: bookError,
  loadBookDetail
} = useBookData(bookId)

const {
  formData,
  submitting,
  errors,
  validateForm,
  resetForm,
  fillForm,
  updateBook
} = useBookForm()


// 加载数据
const loadBookData = async () => {
  await loadBookDetail()
  // 加载完成后初始化表单数据
  if (bookData.value) {
    // 使用 fillForm 方法正确初始化表单数据
    fillForm(bookData.value)
  }
}

// 更新表单数据
const updateFormData = (newData) => {
  Object.assign(formData.value, newData)
}

// 事件处理
const handleSubmit = async (data) => {
  try {
    // 清理数据，避免循环引用
    const cleanData = {
      title: data.title,
      description: data.description,
      color: data.color,
      icon: data.icon
    }
    
    const result = await updateBook(bookId, cleanData)
    if (result.code === 0) {
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    }
  } catch (error) {
    console.error('提交失败:', error)
    uni.showToast({
      title: '保存失败',
      icon: 'error'
    })
  }
}

const handleCancel = () => {
  // 检查是否有未保存的更改
  const hasChanges = bookData.value && (
    formData.value.title !== bookData.value.title ||
    formData.value.description !== bookData.value.description ||
    formData.value.color !== bookData.value.color ||
    formData.value.icon !== bookData.value.icon
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
}

// 生命周期
onMounted(() => {
  loadBookData()
})
</script>

<style lang="scss" scoped>
@import './styles/variables.scss';
@import './styles/mixins.scss';

.edit-todobook {
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
}

.page-title {
  font-size: $font-size-xxl;
  color: $text-primary;
  font-weight: $font-weight-bold;
  text-align: center;
}
</style>