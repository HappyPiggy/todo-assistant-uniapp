# Root Cause Analysis

## Root Cause

### 问题1：编辑和删除按钮融为一体
根本原因在样式设计上（`/pages/tags/manage.scss`）：
- 编辑按钮（`.edit-btn`）和删除按钮（`.delete-btn`）使用了相似的样式
- 两个按钮都设置为透明背景（`background-color: transparent`）
- 按钮尺寸过小（编辑16rpx，删除14rpx）
- 按钮间距过小（`gap: 4rpx`）
- 没有明显的视觉分隔（如边框、背景色或足够的间距）

### 问题3：选中标签的轮廓样式过大
- 选中标签的边框和阴影效果过于夸张（`.tag-item.selected`）
- 边框宽度过大（`border-width: 6rpx`）
- 阴影扩散范围过大，没有准确包裹标签本身

### 问题2：标签颜色修改不同步到任务
根本原因是事件机制不完整：
1. 在 `useTagManage.js` 的 `saveTagEdit` 方法中，虽然触发了 `tag-updated` 事件（第306行），但没有相应的监听器来更新任务中的标签
2. 标签数据在任务中是独立存储的，修改标签时没有批量更新所有使用该标签的任务
3. 缺少一个统一的标签更新机制来确保数据一致性

## Affected Code Locations

1. UI 按钮样式：
   - `/pages/tags/manage.vue` (第81-88行) - 按钮结构
   - `/pages/tags/manage.scss` (第220-248行) - 按钮样式

2. 标签更新逻辑：
   - `/pages/tags/useTagManage.js` (第272-348行) - `saveTagEdit` 方法
   - 需要添加：任务批量更新逻辑
   - 需要添加：标签更新事件监听器

3. 编辑模态框集成：
   - `/pages/tags/components/TagEditModal.vue` - 需要集成删除功能

## Fix Strategy

### 策略1：合并编辑和删除功能
1. 移除独立的删除按钮，只保留一个编辑按钮
2. 在编辑模态框（`TagEditModal`）中添加删除选项
3. 更新编辑按钮样式，使其更明显和易于点击

### 策略2：实现标签颜色同步机制
1. 创建一个云函数来批量更新所有包含特定标签的任务
2. 在 `saveTagEdit` 方法成功后，调用该云函数
3. 添加进度提示，因为批量更新可能需要时间
4. 在相关页面添加事件监听器，接收标签更新通知并刷新显示

## Alternative Solutions

1. **客户端批量更新**：在前端遍历所有任务并更新标签，但这会导致性能问题和可能的数据不一致
2. **延迟同步**：在用户下次访问任务时才更新标签，但这会造成用户困惑
3. **数据库触发器**：使用数据库级别的触发器自动更新，但 uniCloud 可能不支持