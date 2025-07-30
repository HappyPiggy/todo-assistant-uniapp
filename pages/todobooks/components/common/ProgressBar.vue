<template>
  <view class="progress-container">
    <!-- 进度信息 -->
    <view v-if="showText" class="progress-info">
      <text class="progress-label">{{ label }}</text>
      <text class="progress-percent">{{ Math.round(progress) }}%</text>
    </view>
    
    <!-- 进度条 -->
    <view 
      class="progress-bar" 
      :class="{ 'progress-bar--large': size === 'large' }"
      :style="progressBarStyle">
      <view 
        class="progress-fill"
        :class="{ 
          'progress-fill--animated': animated,
          'progress-fill--completed': progress >= 100 
        }"
        :style="progressFillStyle">
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 100
  },
  color: {
    type: String,
    default: '#007AFF'
  },
  showText: {
    type: Boolean,
    default: true
  },
  animated: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'normal',
    validator: (value) => ['normal', 'large'].includes(value)
  },
  label: {
    type: String,
    default: '完成进度'
  }
})

const animationTriggered = ref(false)

// 进度条容器样式
const progressBarStyle = computed(() => {
  const height = props.size === 'large' ? '12rpx' : '8rpx'
  return {
    height
  }
})

// 进度填充样式
const progressFillStyle = computed(() => {
  const safeProgress = Math.max(0, Math.min(100, props.progress))
  const fillColor = props.progress >= 100 ? '#28a745' : props.color
  
  return {
    backgroundColor: fillColor,
    transform: animationTriggered.value ? `scaleX(${safeProgress / 100})` : 'scaleX(0)'
  }
})

// 组件挂载后触发动画
onMounted(() => {
  if (props.animated) {
    // 小延迟确保DOM渲染完成
    setTimeout(() => {
      animationTriggered.value = true
    }, 100)
  } else {
    animationTriggered.value = true
  }
})

// 监听进度变化，实时更新动画
watch(() => props.progress, () => {
  if (props.animated && animationTriggered.value) {
    // 进度变化时保持动画状态
    animationTriggered.value = true
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
@import '@/pages/todobooks/styles/mixins.scss';

.progress-container {
  width: 100%;
}

.progress-info {
  @include flex-between;
  margin-bottom: $margin-sm;
}

.progress-label {
  font-size: $font-size-base;
  color: $text-secondary;
  font-weight: $font-weight-medium;
}

.progress-percent {
  font-size: $font-size-lg;
  color: $text-primary;
  font-weight: $font-weight-semibold;
}

.progress-bar {
  @include progress-bar;
  
  &--large {
    @include progress-bar($progress-height-large);
  }
}

.progress-fill {
  @include progress-fill;
  transform: scaleX(0);
  
  &--animated {
    transition: transform $progress-animation-duration ease-out;
  }
  
  &--completed {
    background-color: $progress-completed-bg !important;
  }
}

// 响应式适配
@media (max-width: 480rpx) {
  .progress-info {
    .progress-label {
      font-size: $font-size-sm;
    }
    
    .progress-percent {
      font-size: $font-size-base;
    }
  }
  
  .progress-bar {
    height: 6rpx; // 小屏幕下稍微减小高度
  }
}
</style>