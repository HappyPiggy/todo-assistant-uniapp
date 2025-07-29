# Implementation Plan

- [ ] 1. 创建CommentDisplay组件基础结构
  - 创建 `/pages/todobooks/components/task/CommentDisplay.vue` 组件文件
  - 实现props接口定义（taskId, commentCount, hasUnread, variant, size）
  - 实现基础模板结构和样式
  - 支持card和item两种显示变体
  - _Requirements: 1.1, 1.3, 2.1, 3.1_

- [ ] 2. 实现CommentDisplay组件样式系统
  - 实现normal和small两种尺寸规格的样式
  - 创建未读红点提示的视觉设计
  - 确保与现有UI设计语言的一致性
  - 实现响应式布局适配
  - _Requirements: 2.2, 3.1, 3.2, 3.4_

- [ ] 3. 实现本地评论统计计算逻辑
  - 创建评论统计工具函数 `calculateCommentStats`
  - 实现评论总数计算（包含回复，排除已删除评论）
  - 实现未读状态判断（基于最后查看时间，排除自己的评论）
  - 添加边界条件处理和容错机制
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3_

- [ ] 5. 扩展VirtualTaskList组件缓存系统
  - 在 `VirtualTaskList.vue` 中添加 `commentStatsCache` 数据结构
  - 实现 `commentStatsMap` 计算属性
  - 集成批量加载评论统计的逻辑
  - 实现智能缓存更新机制
  - _Requirements: 1.4, 4.1, 4.2_

- [ ] 6. 实现评论统计数据的本地计算缓存
  - 监听 `visibleTasks` 变化，识别需要计算统计数据的任务
  - 基于现有评论缓存数据进行本地统计计算
  - 实现计算结果的本地缓存，避免重复计算
  - 添加缓存失效和更新机制
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 7. 集成CommentDisplay组件到TaskItem
  - 在 `TaskItem.vue` 中引入 `CommentDisplay` 组件
  - 在card模式的task-meta区域集成组件
  - 在item模式的task-content区域集成组件
  - 传递必要的props数据（taskId, commentCount, hasUnread, variant）
  - _Requirements: 1.1, 1.3, 3.3_

- [ ] 8. 移除TaskItem中的旧评论提示代码
  - 删除现有的 `comment-hint` 相关代码和样式
  - 移除 `unreadCommentCount` 相关的计算逻辑
  - 清理不再使用的样式类和变量
  - 确保代码整洁性
  - _Requirements: 1.2, 3.1_

- [ ] 9. 实现评论查看状态的本地存储管理
  - 创建本地存储管理工具函数
  - 实现用户查看评论时的状态记录
  - 添加存储数据的读取和更新逻辑
  - 处理存储异常的容错机制
  - _Requirements: 2.3, 4.4_

- [ ] 10. 在VirtualTaskList中实现评论统计数据传递
  - 修改传递给TaskItem的props，包含评论统计数据
  - 确保commentStatsMap数据正确传递到子组件
  - 实现数据更新时的响应式更新机制
  - 添加数据验证和默认值处理
  - _Requirements: 1.4, 3.3, 4.2_

- [ ] 11. 实现评论数据的实时更新机制
  - 监听评论相关的事件（添加、删除、查看）
  - 实现缓存数据的增量更新
  - 确保UI界面的实时同步
  - 处理并发更新的数据一致性
  - _Requirements: 1.4, 2.3, 4.2_

- [ ] 12. 添加错误处理和容错机制
  - 实现网络请求失败时的默认数据处理
  - 添加数据异常时的UI容错显示
  - 实现缓存数据过期的自动清理
  - 确保组件在各种异常情况下的稳定性
  - _Requirements: 4.4_

- [ ] 13. 创建CommentDisplay组件的单元测试
  - 测试不同props组合的渲染结果
  - 验证variant和size属性的样式效果
  - 测试边界条件（commentCount = 0, 大数值等）
  - 验证未读状态的视觉提示功能
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 14. 测试本地统计计算功能和性能
  - 验证评论统计计算逻辑的正确性
  - 测试大量评论数据时的计算性能
  - 验证缓存机制的有效性
  - 测试异常数据的处理逻辑
  - _Requirements: 1.1, 1.4, 4.1, 4.2_

- [ ] 15. 进行集成测试和性能优化
  - 测试VirtualTaskList与CommentDisplay的集成效果
  - 验证虚拟滚动时的数据更新正确性
  - 测试大量任务时的渲染性能
  - 优化内存使用和缓存效率
  - _Requirements: 3.4, 4.1, 4.3_

- [ ] 16. 最终功能验证和样式调优
  - 验证所有需求的实现完整性
  - 测试不同屏幕尺寸下的显示效果
  - 微调样式细节确保视觉一致性
  - 进行端到端的用户体验测试
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_