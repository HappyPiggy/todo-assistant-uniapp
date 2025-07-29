# Implementation Plan

- [ ] 1. 修改TaskItem组件的评论显示逻辑
  - 在TaskItem.vue中添加计算属性处理评论总数和未读状态显示
  - 修改现有的.comment-hint区域模板，同时显示评论总数和未读红点
  - 确保card模式和item模式都正确显示新的评论信息格式
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4, 5.3_

- [ ] 2. 实现评论总数显示功能
  - 在TaskItem.vue中添加commentCount计算属性，使用task.comments?.length || 0获取评论总数
  - 添加commentDisplayText计算属性，格式化显示文本为"X条评论"
  - 在模板中添加评论总数显示，当commentCount > 0时显示
  - 使用现有的字体大小和颜色样式，确保与设计系统一致
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 5.1_

- [ ] 3. 实现未读状态红点提示器
  - 在TaskItem.vue中添加hasUnreadComments计算属性，基于现有unreadCommentCount prop判断
  - 在模板中添加红点元素，当hasUnreadComments为true时显示
  - 创建.unread-dot样式类，实现16rpx圆形红点，使用#ff9800颜色
  - 将红点定位在评论文字右侧，保持8rpx间距
  - _Requirements: 2.1, 2.2, 2.4, 3.2, 5.2_

- [ ] 4. 调整评论区域布局和样式
  - 修改现有.comment-hint样式，优化内部元素的flex布局
  - 确保评论总数文字、图标和红点在同一行正确对齐
  - 为card模式和item模式分别调整布局间距和对齐方式
  - 测试不同评论数量（0条、单条、多条）下的显示效果
  - _Requirements: 2.4, 3.1, 3.3, 3.4_

- [ ] 5. 添加错误处理和边界情况处理
  - 在所有计算属性中添加try-catch错误处理
  - 实现task.comments数据为undefined/null时的安全访问
  - 添加shouldShowCommentInfo计算属性，控制整个评论区域的显示条件
  - 确保数据异常时不影响任务列表的正常显示
  - _Requirements: 4.4, 5.4_

- [ ] 6. 验证功能集成和数据更新
  - 测试评论添加后，评论总数是否实时更新
  - 测试点击任务进入详情页后，未读红点是否正确消失
  - 验证虚拟滚动场景下的性能表现
  - 确认与现有缓存机制的兼容性
  - _Requirements: 1.4, 2.3, 4.1, 4.2, 4.3_

- [ ] 7. 测试不同显示模式和响应式布局
  - 测试card模式下评论信息在meta-left区域的显示效果
  - 测试item模式下评论信息在任务内容下方的显示效果
  - 验证不同屏幕尺寸下的布局适配
  - 确保与现有任务列表排版的协调性
  - _Requirements: 3.3, 3.4, 4.3_