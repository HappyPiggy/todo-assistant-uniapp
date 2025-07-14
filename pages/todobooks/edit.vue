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
      v-else-if="bookData && Object.keys(bookData).length > 0 && !bookLoading"
      :form-data="formData"
      :stats-data="{
        item_count: bookData.item_count || 0,
        completed_count: bookData.completed_count || 0,
        member_count: memberCount || 1
      }"
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
import LoadingState from '@/pages/todobooks/components/common/LoadingState.vue'
import ErrorState from '@/pages/todobooks/components/common/ErrorState.vue'
import BookForm from '@/pages/todobooks/components/book/BookForm.vue'
import { useBookForm } from '@/pages/todobooks/composables/useBookForm.js'
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'
import { onLoad, onShow } from '@dcloudio/uni-app'

const bookId = ref(null)
const hasInitialized = ref(false) // 用于 onShow 判断是否为首次进入页面

// 使用组合函数
const {
  bookData,
  loading: bookLoading,
  error: bookError,
  memberCount,
  loadBookDetail
} = useBookData()

const {
  formData,
  submitting,
  errors,
  resetForm,
  fillForm,
  updateBook
} = useBookForm()


onLoad((options) => {
  console.log("onLoad options", JSON.stringify(options, null, 2))
  if (options && options.id) {
    bookId.value = options.id
    loadBookData()
  } else {
    console.error('错误：未能从路由参数中获取到 id')
    uni.showToast({ title: '页面参数错误', icon: 'error' })
  }
})

onShow(() => {
  // 如果页面已经初始化过，并且 bookId 存在，则刷新数据
  if (hasInitialized.value && bookId.value) {
    Promise.all([
      loadBookData()
    ])
  }
})

// 加载数据
const loadBookData = async () => {
  await loadBookDetail(bookId.value)
  console.log('loadBookDetail 完成，bookData.value:', bookId.value, JSON.stringify(bookData.value, null, 2))
  
  // 加载完成后初始化表单数据
  if (bookData.value && Object.keys(bookData.value).length > 0) {
    //console.log('填充表单数据')
    // 使用 fillForm 方法正确初始化表单数据
    fillForm(bookData.value)
   // console.log('fillForm 完成，formData:', JSON.stringify(formData, null, 2))
  } else {
    console.log('bookData 为空，无法填充表单')
  }
}

// 更新表单数据
const updateFormData = (newData) => {
  Object.assign(formData, newData)
}

// 事件处理
const handleSubmit = async (data) => {
  console.log('handleSubmit 开始, 当前 submitting 状态:', submitting.value)
  
  if (submitting.value) {
    console.log('防止重复提交，直接返回')
    return // 防止重复提交
  }
  
  try {
    console.log('设置 submitting 为 true')
    submitting.value = true // 开始提交
    
    // 清理数据，避免循环引用
    const cleanData = {
      title: data.title,
      description: data.description,
      color: data.color,
      icon: data.icon
    }
    
    const result = await updateBook(bookId, cleanData)
    console.log('updateBook 返回结果:', JSON.stringify(result, null, 2))
    
    // updateBook 返回的格式是 { success: true, data: {...} }
    if (result && result.success) {
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    } else {
      // 如果没有成功标志，抛出错误
      throw new Error(result?.message || '保存失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    // 使用 none 而不是 error，因为 uni-app 中 error 图标可能不存在
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    })
  } finally {
    console.log('设置 submitting 为 false')
    submitting.value = false // 结束提交
  }
}

const handleCancel = () => {
  // 检查是否有未保存的更改
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
}

// 生命周期
onMounted(() => {
  hasInitialized.value = true
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/variables.scss';
@import '@/pages/todobooks/styles/mixins.scss';

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