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
      v-else-if="bookData"
      :initial-data="bookData"
      :loading="submitting"
      :errors="errors"
      mode="edit"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <!-- 项目册预览 -->
    <BookPreview
      :book-data="previewData"
      :show-preview="showPreview"
      @close-preview="showPreview = false"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LoadingState from './components/common/LoadingState.vue'
import ErrorState from './components/common/ErrorState.vue'
import BookForm from './components/book/BookForm.vue'
import BookPreview from './components/book/BookPreview.vue'
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
  updateBook
} = useBookForm()

// 预览相关
const showPreview = ref(false)
const previewData = computed(() => ({
  ...bookData.value,
  title: formData.value.title || bookData.value?.title || '项目册',
  description: formData.value.description || bookData.value?.description || '',
  color: formData.value.color || bookData.value?.color,
  icon: formData.value.icon || bookData.value?.icon
}))

// 加载数据
const loadBookData = async () => {
  await loadBookDetail()
}

// 事件处理
const handleSubmit = async (data) => {
  try {
    const result = await updateBook(bookId, data)
    if (result.success) {
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