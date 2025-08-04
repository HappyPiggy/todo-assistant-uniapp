<template>
  <view 
    class="uni-tag"
    :class="computedClasses"
    :style="computedStyle"
    @click="handleClick">
    <!-- 图标插槽 -->
    <slot name="icon"></slot>
    
    <!-- 文本内容 -->
    <text class="uni-tag__text">
      <slot>{{ displayText }}</slot>
    </text>
  </view>
</template>

<script>
export default {
  name: 'UniTag'
}
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

// Props定义
const props = defineProps({
  // 标签文本内容
  text: {
    type: String,
    required: true
  },
  
  // 背景颜色 (可选，默认为灰色)
  color: {
    type: String,
    default: '#E5E5E5'
  },
  
  // 尺寸规格 (small | medium | large)
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  
  // 最大文本长度 (默认5)
  maxLength: {
    type: Number,
    default: 5
  },
  
  // 自定义样式类
  customClass: {
    type: String,
    default: ''
  },
  
  // 是否禁用 (影响样式和事件)
  disabled: {
    type: Boolean,
    default: false
  }
})

// Events定义
const emit = defineEmits(['click'])

// 文本截断处理
const displayText = computed(() => {
  if (!props.text) return ''
  
  if (props.text.length <= props.maxLength) {
    return props.text
  }
  
  return props.text.substring(0, props.maxLength) + '...'
})

// 动态CSS类计算
const computedClasses = computed(() => {
  const classes = []
  
  // 尺寸类
  classes.push(`uni-tag--${props.size}`)
  
  // 禁用状态类
  if (props.disabled) {
    classes.push('uni-tag--disabled')
  }
  
  // 自定义类
  if (props.customClass) {
    classes.push(props.customClass)
  }
  
  return classes
})

// 动态内联样式计算
const computedStyle = computed(() => {
  const styles = {}
  
  // 背景颜色
  if (props.color) {
    styles.backgroundColor = props.color
  }
  
  return styles
})

// 点击事件处理
const handleClick = (event) => {
  if (props.disabled) return
  
  emit('click', event)
}
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.uni-tag {
  @include tag-base;
  @include tag-clickable;
  
  // 尺寸变体
  &--small {
    @include tag-size('small');
  }
  
  &--medium {
    @include tag-size('medium');
  }
  
  &--large {
    @include tag-size('large');
  }
  
  // 禁用状态
  &--disabled {
    @include tag-disabled;
  }
  
  // 响应式适配
  @include tag-responsive;
}

.uni-tag__text {
  line-height: 1.2;
}
</style>