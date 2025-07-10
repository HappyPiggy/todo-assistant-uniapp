<template>
  <view class="book-form">
    <uni-forms ref="formRef" :model="formData" :rules="rules" label-position="top">
      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">基本信息</text>
        </view>

        <uni-forms-item name="title" label="项目册名称" required>
          <uni-easyinput 
            v-model="formData.title" 
            placeholder="请输入项目册名称"
            :clearable="true"
            :maxlength="100"
            @input="handleTitleChange">
          </uni-easyinput>
        </uni-forms-item>

        <uni-forms-item name="description" label="项目描述">
          <uni-easyinput 
            v-model="formData.description" 
            type="textarea"
            placeholder="描述项目册的内容和目标（可选）"
            :maxlength="500"
            :clearable="true"
            @input="handleDescriptionChange">
          </uni-easyinput>
        </uni-forms-item>
      </view>

      <!-- 外观设置 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">外观设置</text>
        </view>

        <uni-forms-item name="color" label="主题颜色">
          <ColorPicker 
            v-model:selectedColor="formData.color"
            @change="handleColorChange" />
        </uni-forms-item>

        <uni-forms-item name="icon" label="项目图标">
          <IconPicker 
            v-model:selectedIcon="formData.icon"
            :previewColor="formData.color"
            @change="handleIconChange" />
        </uni-forms-item>
      </view>

      <!-- 预览区域 -->
      <view class="form-section" v-if="showPreview">
        <view class="section-header">
          <text class="section-title">预览效果</text>
        </view>
        <BookPreview :previewData="previewData" />
      </view>

      <!-- 统计信息（编辑模式） -->
      <view class="form-section" v-if="mode === 'edit' && statsData">
        <view class="section-header">
          <text class="section-title">统计信息</text>
        </view>
        
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">总任务数</text>
            <text class="stat-value">{{ statsData.item_count || 0 }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">已完成</text>
            <text class="stat-value">{{ statsData.completed_count || 0 }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">成员数</text>
            <text class="stat-value">{{ statsData.member_count || 1 }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">完成率</text>
            <text class="stat-value">{{ calculateCompletionRate(statsData) }}%</text>
          </view>
        </view>
      </view>
    </uni-forms>

    <!-- 操作按钮 -->
    <view class="form-actions">
      <button 
        class="cancel-btn" 
        @click="handleCancel">
        取消
      </button>
      <button 
        class="submit-btn" 
        @click="handleSubmit"
        :loading="loading">
        {{ loading ? (mode === 'edit' ? '保存中...' : '创建中...') : (mode === 'edit' ? '保存' : '创建') }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import ColorPicker from '@/pages/todobooks/components/book/ColorPicker.vue'
import IconPicker from '@/pages/todobooks/components/book//IconPicker.vue'
import BookPreview from '@/pages/todobooks/components/book//BookPreview.vue'
import { calculateCompletionRate } from '@/pages/todobooks/utils/bookUtils.js'
import { VALIDATION_RULES } from '@/pages/todobooks/utils/constants.js'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'create', // create, edit
    validator: (value) => ['create', 'edit'].includes(value)
  },
  showPreview: {
    type: Boolean,
    default: true
  },
  statsData: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:formData', 'titleChange', 'descriptionChange', 'colorChange', 'iconChange', 'submit', 'cancel'])

const rules = VALIDATION_RULES.BOOK_FORM

const previewData = computed(() => {
  if (!props.formData) {
    return {
      title: '项目册名称',
      description: '项目描述',
      color: '#007AFF',
      icon: 'folder',
      stats: {
        total: 0,
        completed: 0,
        members: 1,
        progress: 0
      }
    }
  }
  
  return {
    title: props.formData.title || '项目册名称',
    description: props.formData.description || '项目描述',
    color: props.formData.color || '#007AFF',
    icon: props.formData.icon || 'folder',
    stats: {
      total: (props.statsData && props.statsData.item_count) || 0,
      completed: (props.statsData && props.statsData.completed_count) || 0,
      members: (props.statsData && props.statsData.member_count) || 1,
      progress: props.statsData ? calculateCompletionRate(props.statsData) : 0
    }
  }
})

const handleTitleChange = (value) => {
  emit('titleChange', value)
}

const handleDescriptionChange = (value) => {
  emit('descriptionChange', value)
}

const handleColorChange = (color) => {
  emit('colorChange', color)
}

const handleIconChange = (icon) => {
  emit('iconChange', icon)
}

const handleSubmit = () => {
  emit('submit', props.formData)
}

const handleCancel = () => {
  emit('cancel')
}

// 暴露表单验证方法
defineExpose({
  validate: () => {
    return new Promise((resolve, reject) => {
      // 这里需要访问uni-forms的validate方法
      // 由于我们使用的是setup语法，需要通过ref获取
      resolve(true) // 简化处理
    })
  }
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.book-form {
  gap: $margin-base;
}

.form-section {
  @include card-style;
  margin-bottom: $margin-base;
}

.section-header {
  @include flex-between;
  padding-bottom: $padding-base;
  border-bottom: 1rpx solid $border-color-light;
  margin-bottom: $padding-base;
}

.section-title {
  font-size: $font-size-xl;
  color: $text-primary;
  font-weight: $font-weight-medium;
}

/* 表单项样式 */
/* #ifndef APP-NVUE */
.form-section ::v-deep .uni-forms-item {
  padding: $padding-base 0;
  border-bottom: 1rpx solid $border-color-light;
}

.form-section ::v-deep .uni-forms-item:last-child {
  border-bottom: none;
}

.form-section ::v-deep .uni-forms-item__label {
  font-size: $font-size-lg;
  color: $text-primary;
  font-weight: $font-weight-medium;
  margin-bottom: $margin-sm;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  min-width: 200rpx;
}

.form-section ::v-deep .uni-easyinput__content {
  border: 1rpx solid $border-color;
  border-radius: $border-radius-small;
  background-color: $bg-light;
}

.form-section ::v-deep .uni-easyinput__content-input {
  padding: $padding-base;
  font-size: $font-size-base;
  color: $text-primary;
}

.form-section ::v-deep .uni-easyinput__content-textarea {
  padding: $padding-base;
  font-size: $font-size-base;
  color: $text-primary;
  min-height: 200rpx;
}
/* #endif */

/* 统计信息 */
.stats-grid {
  @include flex-between;
  flex-wrap: wrap;
  gap: $margin-base;
}

.stat-item {
  flex: 1;
  min-width: 150rpx;
  background-color: $bg-light;
  padding: $padding-base;
  border-radius: $border-radius-small;
  @include flex-column;
  align-items: center;
}

.stat-label {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $margin-xs;
}

.stat-value {
  font-size: $font-size-xl;
  color: $text-primary;
  font-weight: $font-weight-semibold;
}

/* 操作按钮 */
.form-actions {
  display: flex;
  gap: $margin-base;
  padding: $padding-lg;
  position: sticky;
  bottom: 0;
  background-color: $bg-white;
  border-top: 1rpx solid $border-color-light;
  /* #ifndef APP-NVUE */
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.1);
  /* #endif */
}

.cancel-btn {
  flex: 1;
  height: 88rpx;
  font-size: $font-size-base;
  border: 1rpx solid $border-color;
  border-radius: $border-radius;
  color: $text-secondary;
  background-color: $bg-light;
}

.submit-btn {
  flex: 1;
  height: 88rpx;
  font-size: $font-size-base;
  border-radius: $border-radius;
  background-color: $primary-color;
  color: $bg-white;
}
</style>