<template>
  <view class="tag-filter-popup" v-if="show">
    <view class="popup-overlay" @click="close"></view>
    <view class="popup-panel">
      <view class="popup-header">
        <text class="popup-title">选择标签</text>
        <text class="close-btn" @click="close">✕</text>
      </view>
      
      <scroll-view class="tag-list" :scroll-y="true">
        <view class="tag-section">
          <text class="section-title">可用标签</text>
          <view class="tag-items">
            <view 
              v-for="tag in availableTags"
              :key="tag.id || tag"
              class="tag-item"
              :class="{ selected: isTagSelected(tag) }"
              @click="toggleTag(tag)"
            >
              <text class="tag-text">{{ getTagName(tag) }}</text>
              <view v-if="isTagSelected(tag)" class="check-icon">✓</view>
            </view>
          </view>
        </view>
        
        <view v-if="selectedTags.length > 0" class="tag-section">
          <text class="section-title">已选标签</text>
          <view class="selected-tags">
            <view 
              v-for="tag in selectedTags"
              :key="tag.id || tag"
              class="selected-tag"
              @click="toggleTag(tag)"
            >
              <text class="selected-tag-text">{{ getTagName(tag) }}</text>
              <text class="remove-btn">✕</text>
            </view>
          </view>
        </view>
      </scroll-view>
      
      <view class="popup-footer">
        <button class="cancel-btn" @click="cancel">取消</button>
        <button class="confirm-btn" @click="confirm">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  availableTags: {
    type: Array,
    default: () => []
  },
  selectedTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'confirm'])

const tempSelectedTags = ref([...props.selectedTags])

const isTagSelected = (tag) => {
  const tagId = getTagId(tag)
  return tempSelectedTags.value.some(selectedTag => getTagId(selectedTag) === tagId)
}

const getTagId = (tag) => {
  return typeof tag === 'object' ? tag.id : tag
}

const getTagName = (tag) => {
  return typeof tag === 'object' ? tag.name : tag
}

const toggleTag = (tag) => {
  const tagId = getTagId(tag)
  const index = tempSelectedTags.value.findIndex(selectedTag => getTagId(selectedTag) === tagId)
  
  if (index > -1) {
    tempSelectedTags.value.splice(index, 1)
  } else {
    tempSelectedTags.value.push(tag)
  }
}

const close = () => {
  emit('close')
}

const cancel = () => {
  tempSelectedTags.value = [...props.selectedTags]
  emit('close')
}

const confirm = () => {
  emit('confirm', tempSelectedTags.value)
  emit('close')
}

// 重置临时选择状态
const resetTempSelection = () => {
  tempSelectedTags.value = [...props.selectedTags]
}

// 监听显示状态变化，重置临时选择
watch(() => props.show, (newVal) => {
  if (newVal) {
    resetTempSelection()
  }
})
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.tag-filter-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  
  .popup-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
  }
  
  .popup-panel {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: $bg-white;
    border-radius: 24rpx 24rpx 0 0;
    max-height: 80vh;
    @include flex-column;
    
    .popup-header {
      @include flex-between;
      padding: $padding-base;
      border-bottom: 1rpx solid $border-color;
      
      .popup-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
      }
      
      .close-btn {
        font-size: $font-size-lg;
        color: $text-tertiary;
        padding: $padding-xs;
        cursor: pointer;
        
        &:active {
          color: $text-secondary;
        }
      }
    }
    
    .tag-list {
      flex: 1;
      padding: $padding-base;
      max-height: 60vh;
      
      .tag-section {
        margin-bottom: $margin-lg;
        
        .section-title {
          font-size: $font-size-base;
          font-weight: $font-weight-medium;
          color: $text-secondary;
          margin-bottom: $margin-sm;
          display: block;
        }
        
        .tag-items {
          display: flex;
          flex-wrap: wrap;
          gap: $margin-xs;
          
          .tag-item {
            @include flex-center;
            padding: $padding-xs $padding-sm;
            background: $gray-100;
            border-radius: 20rpx;
            border: 2rpx solid transparent;
            transition: $transition-fast;
            cursor: pointer;
            position: relative;
            
            &.selected {
              background: rgba($primary-color, 0.1);
              border-color: $primary-color;
              
              .tag-text {
                color: $primary-color;
              }
              
              .check-icon {
                position: absolute;
                right: -4rpx;
                top: -4rpx;
                width: 32rpx;
                height: 32rpx;
                background: $primary-color;
                border-radius: 50%;
                color: $bg-white;
                font-size: $font-size-xs;
                @include flex-center;
              }
            }
            
            &:active {
              transform: scale(0.95);
            }
            
            .tag-text {
              font-size: $font-size-sm;
              color: $text-secondary;
            }
          }
        }
        
        .selected-tags {
          display: flex;
          flex-wrap: wrap;
          gap: $margin-xs;
          
          .selected-tag {
            @include flex-center;
            padding: $padding-xs $padding-sm;
            background: $primary-color;
            border-radius: 20rpx;
            cursor: pointer;
            
            &:active {
              background: rgba($primary-color, 0.8);
            }
            
            .selected-tag-text {
              font-size: $font-size-sm;
              color: $bg-white;
              margin-right: $margin-xs;
            }
            
            .remove-btn {
              font-size: $font-size-xs;
              color: $bg-white;
              opacity: 0.8;
            }
          }
        }
      }
    }
    
    .popup-footer {
      @include flex-between;
      padding: $padding-base;
      border-top: 1rpx solid $border-color;
      gap: $margin-base;
      
      button {
        flex: 1;
        height: 80rpx;
        border-radius: 12rpx;
        font-size: $font-size-base;
        border: none;
        cursor: pointer;
        
        &.cancel-btn {
          background: $gray-100;
          color: $text-secondary;
          
          &:active {
            background: $gray-200;
          }
        }
        
        &.confirm-btn {
          background: $primary-color;
          color: $bg-white;
          
          &:active {
            background: rgba($primary-color, 0.8);
          }
        }
      }
    }
  }
}
</style>