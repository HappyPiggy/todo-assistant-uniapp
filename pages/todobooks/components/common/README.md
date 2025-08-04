# UniTag 组件

一个统一的标签显示组件，用于在项目中提供一致的标签视觉效果。

## 功能特点

- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🎨 **统一样式** - 一致的视觉效果和交互反馈
- 📏 **多种尺寸** - small/medium/large 三种规格
- 🎨 **自定义颜色** - 支持任意背景色
- ✂️ **文本截断** - 自动处理超长文本
- 🚫 **禁用状态** - 支持禁用状态显示
- 🎯 **事件透传** - 简单的点击事件处理

## 基本用法

```vue
<template>
  <!-- 基础用法 -->
  <UniTag text="默认标签" />
  
  <!-- 自定义颜色和尺寸 -->
  <UniTag 
    text="自定义标签" 
    color="#007AFF" 
    size="large" />
  
  <!-- 带点击事件 -->
  <UniTag 
    text="可点击标签" 
    color="#28a745" 
    @click="handleTagClick" />
</template>

<script setup>
import UniTag from '@/pages/todobooks/components/common/UniTag.vue'

const handleTagClick = () => {
  console.log('标签被点击了')
}
</script>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | String | - | **必需** 标签显示的文本内容 |
| color | String | '#E5E5E5' | 标签背景色，支持任意CSS颜色值 |
| size | String | 'medium' | 标签尺寸，可选: 'small', 'medium', 'large' |
| maxLength | Number | 5 | 文本最大长度，超出部分显示省略号 |
| customClass | String | '' | 自定义CSS类名 |
| disabled | Boolean | false | 是否禁用，禁用时不响应点击事件 |

## Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| click | 点击标签时触发 | (event: Event) |

## Slots

| 插槽名 | 说明 |
|--------|------|
| default | 自定义标签内容，会覆盖 text prop |
| icon | 在文本前显示图标 |

## 尺寸规格

| 尺寸 | 内边距 | 圆角 | 字体大小 | 使用场景 |
|------|--------|------|----------|----------|
| small | 4rpx 8rpx | 8rpx | 20rpx | 列表项、紧凑显示 |
| medium | 8rpx 16rpx | 12rpx | 24rpx | 一般显示、表单 |
| large | 12rpx 20rpx | 16rpx | 28rpx | 详情页、预览 |

## 使用示例

### 1. 简单展示场景

```vue
<template>
  <!-- 任务列表中的标签 -->
  <UniTag 
    v-for="tag in task.tags" 
    :key="tag.id"
    :text="tag.name" 
    :color="tag.color" 
    size="small" />
</template>
```

### 2. 可点击选择场景

```vue
<template>
  <!-- 标签筛选器 -->
  <UniTag 
    v-for="tag in availableTags" 
    :key="tag.id"
    :text="tag.name" 
    :color="isSelected(tag) ? tag.color : '#E5E5E5'" 
    size="medium"
    @click="toggleTag(tag)" />
</template>

<script setup>
const selectedTags = ref([])

const isSelected = (tag) => {
  return selectedTags.value.includes(tag.id)
}

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag.id)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag.id)
  }
}
</script>
```

### 3. 带删除功能场景

```vue
<template>
  <!-- 表单中的可删除标签 -->
  <view 
    v-for="(tag, index) in formTags" 
    :key="tag.id"
    class="tag-item-wrapper">
    <UniTag 
      :text="tag.name" 
      :color="tag.color" 
      size="medium" />
    <view class="delete-btn" @click="removeTag(index)">
      <uni-icons color="#ffffff" size="14" type="clear" />
    </view>
  </view>
</template>

<script setup>
const removeTag = (index) => {
  formTags.value.splice(index, 1)
}
</script>

<style lang="scss" scoped>
.tag-item-wrapper {
  position: relative;
  display: inline-block;
  margin-right: 8rpx;
  margin-bottom: 8rpx;
}

.delete-btn {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  width: 20rpx;
  height: 20rpx;
  background-color: #ff4757;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

### 4. 使用插槽自定义内容

```vue
<template>
  <!-- 带图标的标签 -->
  <UniTag color="#ff9800">
    <template #icon>
      <uni-icons color="#ffffff" size="12" type="star" />
    </template>
    重要标签
  </UniTag>
  
  <!-- 完全自定义内容 -->
  <UniTag color="#17a2b8">
    <view class="custom-content">
      <text>自定义</text>
      <text class="count">(3)</text>
    </view>
  </UniTag>
</template>

<style lang="scss" scoped>
.custom-content {
  display: flex;
  align-items: center;
  gap: 4rpx;
  
  .count {
    opacity: 0.8;
    font-size: 0.9em;
  }
}
</style>
```

## 注意事项

1. **职责边界**: UniTag 组件只负责显示，删除、编辑等业务逻辑请在父组件中处理
2. **颜色对比度**: 组件固定使用白色文字，请确保背景色有足够的对比度
3. **文本长度**: 建议标签文本长度不超过5个字符，超出部分会自动截断
4. **响应式**: 在小屏幕设备上，组件会自动调整尺寸以保持可读性

## 迁移指南

### 从现有 tag 样式迁移

**原来的写法:**
```vue
<view class="tag-item" :style="{ backgroundColor: tag.color }">
  <text class="tag-text">{{ tag.name }}</text>
</view>
```

**新的写法:**
```vue
<UniTag :text="tag.name" :color="tag.color" />
```

### 带删除功能的迁移

**原来的写法:**
```vue
<view class="tag-item" :style="{ backgroundColor: tag.color }">
  <text class="tag-text">{{ tag.name }}</text>
  <view class="remove-tag" @click="removeTag(index)">
    <uni-icons color="#ffffff" size="14" type="clear" />
  </view>
</view>
```

**新的写法:**
```vue
<view class="tag-with-delete">
  <UniTag :text="tag.name" :color="tag.color" />
  <view class="delete-btn" @click="removeTag(index)">
    <uni-icons color="#ffffff" size="14" type="clear" />
  </view>
</view>
```

## 版本历史

- **v1.0.0** - 初始版本，支持基础显示和三种尺寸