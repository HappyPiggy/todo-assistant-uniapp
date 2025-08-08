# Implementation Plan - 离线访客模式

## 任务列表

- [ ] 1. 创建本地存储管理基础设施
  - [ ] 1.1 创建LocalStorageManager类实现本地数据存储
    - 在 `store/localStorageManager.js` 创建本地存储管理器
    - 实现基础的存储读写和数据验证方法
    - 添加存储容量检测和错误处理
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  
  - [ ] 1.2 实现TodoBook本地CRUD操作
    - 在LocalStorageManager中实现getTodoBooks方法
    - 实现createTodoBook方法，包含1个TodoBook限制逻辑
    - 实现updateTodoBook和deleteTodoBook方法
    - 生成本地ID格式：`local_book_${timestamp}_${random}`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 1.3 实现Task本地CRUD操作
    - 在LocalStorageManager中实现getTasks方法
    - 实现createTask、updateTask、deleteTask方法
    - 实现任务状态更新方法
    - 处理父子任务关系
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

- [ ] 2. 创建认证状态管理和数据适配层
  - [ ] 2.1 创建认证状态管理composable
    - 创建 `composables/useAuthState.js`
    - 实现isGuest计算属性判断用户登录状态
    - 实现checkFeatureAccess方法检查功能权限
    - _Requirements: 1.5, 5.1, 5.3_
  
  - [ ] 2.2 创建数据访问适配器
    - 创建 `composables/useDataAdapter.js`
    - 根据登录状态动态切换数据源（云端/本地）
    - 确保接口返回格式一致
    - _Requirements: 2.5, 3.6_
  
  - [ ] 2.3 创建功能访问守卫工具
    - 创建 `utils/featureGuard.js`
    - 定义访客允许和禁止的功能列表
    - 实现功能访问检查逻辑
    - _Requirements: 5.3_

- [ ] 3. 改造核心页面支持访客模式
  - [ ] 3.1 改造首页TodoBook列表页面
    - 修改 `pages/list/list.vue`
    - 集成useDataAdapter获取本地或云端数据
    - 添加访客模式标识显示
    - 移除未登录自动跳转逻辑
    - _Requirements: 1.1, 7.1, 7.4_
  
  - [ ] 3.2 改造TodoBook详情页
    - 修改 `pages/todobooks/detail.vue`
    - 使用数据适配器加载TodoBook和任务数据
    - 禁用访客用户的成员管理、分享等功能
    - 添加功能限制提示
    - _Requirements: 1.2, 5.1_
  
  - [ ] 3.3 改造任务详情页
    - 修改 `pages/tasks/detail.vue`
    - 支持本地任务数据加载和编辑
    - 禁用评论功能并显示提示
    - _Requirements: 1.3, 3.5_
  
  - [ ] 3.4 改造个人中心页
    - 修改 `pages/ucenter/ucenter.vue`
    - 显示未登录状态界面
    - 添加"登录解锁更多功能"入口
    - 移除自动跳转登录逻辑
    - _Requirements: 1.4, 5.2, 7.2_

- [ ] 4. 实现TodoBook表单页面的访客模式支持
  - [ ] 4.1 改造TodoBook创建/编辑表单
    - 修改 `pages/todobooks/form.vue`
    - 集成本地存储管理器
    - 实现访客用户1个TodoBook限制
    - 添加超限提示
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [ ] 4.2 改造任务创建/编辑表单
    - 修改 `pages/tasks/form.vue`
    - 支持本地任务数据保存
    - 移除评论相关功能
    - _Requirements: 3.1, 3.2_

- [ ] 5. 创建登录提示组件和功能限制处理
  - [ ] 5.1 创建统一的登录提示Modal组件
    - 创建 `components/LoginPromptModal.vue`
    - 实现"立即登录"和"稍后再说"选项
    - 支持自定义提示文案
    - _Requirements: 5.1, 5.4_
  
  - [ ] 5.2 在需要登录的功能入口添加权限检查
    - 标签管理页面添加登录检查
    - 成员管理功能添加登录检查
    - 分享管理功能添加登录检查
    - 归档管理功能添加登录检查
    - 统计功能添加登录检查
    - _Requirements: 5.3_

- [ ] 6. 实现页面刷新和多标签页数据同步
  - [ ] 6.1 实现页面刷新时的数据恢复
    - 在应用启动时从localStorage恢复数据
    - 验证数据格式有效性
    - 处理数据损坏情况
    - _Requirements: 4.2, 4.5_
  
  - [ ] 6.2 实现多标签页数据同步机制
    - 监听storage事件实现跨标签页同步
    - 处理并发写入冲突
    - _Requirements: 4.1_

- [ ] 7. 完善错误处理和用户提示
  - [ ] 7.1 实现存储容量检测和提示
    - 在写入前检测localStorage可用空间
    - 存储空间不足时显示友好提示
    - 提供清理建议或登录引导
    - _Requirements: 4.4_
  
  - [ ] 7.2 处理隐私模式和localStorage不可用情况
    - 检测隐私模式或localStorage禁用
    - 显示相应的错误提示和解决方案
    - _Requirements: 4.4_

- [ ] 8. 优化和完善
  - [ ] 8.1 优化本地数据存储性能
    - 实现数据压缩减少存储空间占用
    - 优化读写性能
    - 添加数据缓存机制
    
  - [ ] 8.2 完善UI细节和交互体验
    - 统一访客模式的视觉标识
    - 优化功能限制的提示方式
    - 确保交互流畅性
    - _Requirements: 7.1, 7.4_

任务看起来怎么样？