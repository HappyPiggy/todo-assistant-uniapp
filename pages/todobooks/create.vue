<template>
  <view class="create-todobook">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">创建项目册</text>
    </view>

    <!-- 项目册表单 -->
    <BookForm
      :form-data="formData"
      :loading="submitting"
      :errors="errors"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import BookForm from '@/pages/todobooks/components/book/BookForm.vue'
import { useBookForm } from '@/pages/todobooks/composables/useBookForm.js'
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'

// 使用组合函数
const {
  formData,
  submitting,
  errors
} = useBookForm()

const {
  createTodoBook
} = useBookData()

// 事件处理
const handleSubmit = async (data) => {
  if (submitting.value) return // 防止重复提交
  
  try {
    submitting.value = true // 开始提交
    
    const result = await createTodoBook(data)
    if (result) {
      uni.showToast({
        title: '创建成功',
        icon: 'success'
      })
      
      // 返回列表页面而不是跳转到详情页
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    }
  } catch (error) {
    uni.showToast({
      title: '创建失败',
      icon: 'error'
    })
  } finally {
    submitting.value = false // 结束提交
  }
}

const handleCancel = () => {
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
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';
@import '@/pages/todobooks/styles/mixins.scss';

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