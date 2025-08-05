# Implementation Plan

- [ ] 1. 创建内容格式化工具模块
  - 创建 `/pages/todobooks/utils/copyFormatters.js` 文件
  - 实现 `formatTaskInfo` 函数，格式化任务的所有信息
  - 实现 `formatCommentInfo` 函数，格式化评论内容
  - 实现 `formatDateTime` 辅助函数，统一时间格式
  - 编写单元测试验证格式化输出
  - _Requirements: 1.2, 3.2, 4.1, 4.2, 4.3_

- [ ] 2. 实现任务列表项的长按复制功能
  - [ ] 2.1 修改 TaskItem 组件支持长按事件
    - 在 `/pages/todobooks/components/task/TaskItem.vue` 的根元素添加 `@longtap` 事件
    - 导入 `copyToClipboard` 和 `formatTaskInfo` 函数
    - 实现 `handleLongPress` 方法处理长按事件
    - _Requirements: 1.1, 1.3_
  
  - [ ] 2.2 处理任务信息的完整提取
    - 确保提取任务的主要字段（标题、描述、标签、截止日期、预算、实际花费、创建时间等）
    - 处理子任务信息的递归提取
    - 处理空值和未设置字段的显示逻辑
    - _Requirements: 1.2, 1.5, 4.4_

- [ ] 3. 实现任务详情页的描述复制功能
  - [ ] 3.1 修改任务详情页支持描述长按
    - 在 `/pages/tasks/detail.vue` 的描述区域添加 `@longtap` 事件
    - 实现 `handleDescriptionLongPress` 方法
    - 导入 `copyToClipboard` 函数
    - _Requirements: 2.1, 2.2_
  
  - [ ] 3.2 添加描述内容的验证逻辑
    - 检查描述是否为空，空描述不触发复制
    - 处理富文本内容，确保复制纯文本
    - 实现成功和失败的提示反馈
    - _Requirements: 2.3, 2.4, 2.5_

- [ ] 4. 实现评论区的长按复制功能
  - [ ] 4.1 修改评论显示区域支持长按
    - 在 `/pages/tasks/detail.vue` 的评论内容元素添加 `@longtap` 事件
    - 为主评论和回复评论分别添加长按处理
    - 实现 `handleCommentLongPress` 方法
    - _Requirements: 3.1, 3.5_
  
  - [ ] 4.2 处理评论内容的格式化
    - 导入 `formatCommentInfo` 函数
    - 处理评论者信息、时间戳和内容的组合
    - 处理图片和附件的特殊标记
    - _Requirements: 3.2, 3.3, 3.4_

- [ ] 5. 实现错误处理和用户反馈
  - [ ] 5.1 添加复制操作的错误处理
    - 在所有复制操作中添加 try-catch 块
    - 捕获并处理复制失败的情况
    - 显示用户友好的错误提示
    - _Requirements: 1.4_
  
  - [ ] 5.2 优化长按事件的用户体验
    - 添加防抖处理，避免重复触发
    - 确保长按时间阈值合适（350ms）
    - 处理长按过程中的其他交互冲突
    - _Requirements: 1.1, 2.1, 3.1_

- [ ] 6. 编写集成测试验证功能完整性
  - 测试任务列表长按复制的完整流程
  - 测试任务详情页描述复制功能
  - 测试评论区各种场景的复制功能
  - 验证跨平台兼容性（H5、微信小程序、App）
  - 测试内容截断和特殊字符处理
  - _Requirements: 4.5_