<template>
  <view class="create-todobook">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">创建项目册</text>
    </view>

    <!-- 项目册表单 -->
    <BookForm
      :loading="submitting"
      :errors="errors"
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
import { ref, computed } from 'vue'
import BookForm from './components/book/BookForm.vue'
import BookPreview from './components/book/BookPreview.vue'
import { useBookForm } from './composables/useBookForm.js'

// 使用组合函数
const {
  formData,
  submitting,
  errors,
  validateForm,
  resetForm,
  saveBook
} = useBookForm()

// 预览相关
const showPreview = ref(false)
const previewData = computed(() => ({
  title: formData.value.title || '新项目册',
  description: formData.value.description || '这是一个新的项目册',
  color: formData.value.color,
  icon: formData.value.icon,
  created_at: new Date(),
  item_count: 0,
  completed_count: 0,
  member_count: 1
}))

// 事件处理
const handleSubmit = async (data) => {
  try {
    const result = await saveBook(data)
    if (result.success) {
      uni.showToast({
        title: '创建成功',
        icon: 'success'
      })
      
      // 跳转到详情页
      setTimeout(() => {
        uni.redirectTo({
          url: `/pages/todobooks/detail?id=${result.data._id}`
        })
      }, 1000)
    }
  } catch (error) {
    uni.showToast({
      title: '创建失败',
      icon: 'error'
    })
  }
}

const handleCancel = () => {
  if (formData.value.title || formData.value.description) {
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
</script>

<style lang="scss" scoped>
@import './styles/variables.scss';
@import './styles/mixins.scss';

.create-todobook {
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