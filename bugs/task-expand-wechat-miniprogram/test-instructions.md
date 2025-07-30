# 测试指南：task-expand-wechat-miniprogram

## 测试环境准备

1. **开发环境**：确保在HBuilderX中打开项目
2. **微信开发者工具**：配置好微信小程序开发环境
3. **测试数据**：准备包含子任务的TodoBook和任务数据

## 测试步骤

### 1. H5环境验证（确保未破坏原有功能）
1. 在HBuilderX中运行到浏览器
2. 登录并进入任意TodoBook详情页面
3. 查找包含子任务的任务项（显示向右箭头图标）
4. 点击任务项，验证子任务列表能正常展开/收起
5. 验证展开后图标变为向下箭头

### 2. 微信小程序环境测试（核心测试）
1. 在HBuilderX中运行到微信开发者工具
2. 在微信开发者工具中打开小程序
3. 登录并进入任意TodoBook详情页面
4. 查找包含子任务的任务项
5. **关键测试**：点击包含子任务的任务项
6. **预期结果**：任务应该展开显示子任务列表
7. 再次点击任务项，应该收起子任务列表
8. 验证展开/收起动画和图标变化正常

### 3. 边界情况测试
1. 测试没有子任务的任务点击（应该跳转到详情页）
2. 测试多级嵌套任务的展开（如果存在）
3. 测试在归档状态下的任务展开功能
4. 测试滚动状态下的任务展开功能

### 4. 性能和稳定性测试
1. 连续快速点击任务项，验证没有异常
2. 同时展开多个任务，验证性能表现
3. 在低性能设备上测试响应速度

## 调试信息

如果问题仍然存在，可以添加以下调试代码来诊断：

```javascript
// 在 detail.vue 的 handleTaskClick 函数中添加
console.log('点击任务:', task.title, 'subtask_count:', task.subtask_count)
console.log('展开状态变化:', 'before:', task.expanded, 'after:', !task.expanded)

// 在 nextTick 后添加
console.log('nextTick 后的状态:', task.expanded)
```

## 预期修复效果

- ✅ 微信小程序中点击包含子任务的任务能正常展开
- ✅ 展开后能正常收起
- ✅ 图标状态正确更新（右箭头→下箭头）
- ✅ H5环境功能保持不变
- ✅ 无性能问题或异常报错

## 回退方案

如果修复导致其他问题，可以使用以下git命令回退：

```bash
git checkout HEAD~1 -- pages/todobooks/detail.vue pages/todobooks/components/task/TaskItem.vue
```