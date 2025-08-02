# Implementation Plan

## 任务排序功能实现计划

- [ ] 1. 创建TaskSort组件基础结构
  - 创建TaskSort.vue主组件，包含排序按钮触发器和状态显示
  - 实现基础的点击交互和样式，复用TaskFilter的UI设计模式
  - 添加排序图标和当前排序状态文本显示
  - _Requirements: 4.1, 4.4_

- [ ] 1.1 创建TaskSortPicker弹窗组件
  - 创建TaskSortPicker.vue弹窗选择器组件
  - 实现底部弹出面板UI，参考TagFilter的弹窗设计
  - 定义排序选项数据结构和选项列表渲染
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 1.2 实现排序选项配置和选择逻辑
  - 定义完整的排序选项配置（创建时间、更新时间、Tag类别的升降序）
  - 实现选项选择和确认逻辑
  - 添加当前选中状态的视觉反馈
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

- [ ] 2. 实现本地存储和用户隔离机制
  - 实现getSortStorageKey函数，生成格式为task_sort_${userId}_${todorbookId}的存储键
  - 实现saveSortToLocal和loadSortFromLocal函数，包含完整的错误处理
  - 添加currentUserId监听，处理用户切换时的数据隔离
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 2.1 实现排序数据持久化
  - 实现排序选项的JSON格式存储，包含timestamp时间戳
  - 在组件挂载时自动加载用户的排序偏好
  - 在排序选项变更时自动保存到本地存储
  - _Requirements: 4.5, 4.6, 6.1, 6.6_

- [ ] 3. 扩展useTaskData.js添加排序逻辑
  - 在useTaskData.js中添加currentSort响应式状态管理
  - 实现setSortOption方法来更新排序配置
  - 创建sortedTasks计算属性，基于filteredTasks应用排序
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 3.1 实现时间字段排序算法
  - 实现sortByTime函数，支持created_at和updated_at字段的升降序排序
  - 处理missing timestamps的情况，updated_at为空时使用created_at
  - 添加错误处理，确保排序失败时返回原始列表
  - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 2.4_

- [ ] 3.2 实现Tag分组排序算法
  - 实现sortByTags函数，先按tag进行任务分组
  - 实现tag组的字母顺序排序（支持升降序）
  - 组内任务按创建时间降序排列
  - 处理多tag任务（使用第一个tag）和无tag任务（放在最后）
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3.3 实现排序与过滤的集成逻辑
  - 确保排序在过滤之后执行（先过滤后排序）
  - 验证排序不影响现有的状态筛选、tag筛选、搜索筛选
  - 实现排序条件变更时保持过滤状态
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 4. 集成TaskSort组件到TaskFilter
  - 修改TaskFilter.vue，在tag筛选按钮旁添加TaskSort组件
  - 更新TaskFilter的样式，确保排序按钮与tag按钮的视觉一致性
  - 传递必要的props（todorbookId、currentSort等）
  - _Requirements: 4.1, 4.4_

- [ ] 4.1 更新VirtualTaskList集成排序功能
  - 在VirtualTaskList.vue中集成TaskSort组件的状态管理
  - 处理排序变更事件，更新useTaskData中的排序状态
  - 确保fixedHeaderHeight计算包含排序组件高度
  - _Requirements: 4.2, 4.4, 5.2, 5.3_

- [ ] 5. 实现排序性能优化
  - 添加排序操作的loading状态指示器
  - 实现排序响应时间控制（500ms内完成）
  - 对大量任务（1000+）进行性能测试和优化
  - _Requirements: 4.2, 4.3_

- [ ] 5.1 优化排序算法性能
  - 使用computed缓存排序结果，避免不必要的重排序
  - 实现排序结果的memorization缓存
  - 为大数据量添加分批处理逻辑
  - _Requirements: 4.2_

- [ ] 6. 完善用户体验和错误处理
  - 实现默认排序状态（创建时间降序）的正确显示
  - 添加排序失败时的用户友好提示
  - 验证排序选择器在无数据时的可用状态
  - _Requirements: 4.1, 4.2, 5.4, 6.4, 6.5_

- [ ] 6.1 验证兼容性和边界情况处理
  - 实现新老tag格式（字符串和对象）的兼容性处理
  - 添加任务数据字段缺失时的安全处理逻辑
  - 确保多用户同设备的数据隔离实现正确
  - _Requirements: 3.4, 3.5, 6.2, 6.3_

- [ ] 7. 最终功能集成和完善
  - 完成所有组件的最终集成
  - 添加必要的console.log调试信息以便测试
  - 确保排序功能与现有功能的完全兼容
  - 验证所有交互流程的完整性
  - _Requirements: 所有需求的代码实现_