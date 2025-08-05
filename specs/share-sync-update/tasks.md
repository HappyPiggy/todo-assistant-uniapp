# Implementation Plan

## 任务清单

- [ ] 1. 扩展数据库模型
  - [ ] 1.1 修改 todobook_shares 表结构
    - 在 `/uniCloud-alipay/database/todobook_shares.schema.json` 中添加 `last_sync_at` 和 `sync_count` 字段
    - 设置字段的默认值和验证规则
    - _Requirements: 2.3, 4.3_
  
  - [ ] 1.2 部署数据库更新
    - 在 uniCloud 控制台更新数据库 schema
    - 验证现有数据的兼容性
    - _Requirements: 2.3_

- [ ] 2. 实现云函数核心逻辑
  - [ ] 2.1 创建 checkShareStatus 方法
    - 在 `/uniCloud-alipay/cloudfunctions/todobook-co/module/share/check-share-status.js` 中实现
    - 检查项目册是否已分享
    - 计算是否可以同步（24小时限制）
    - 返回分享信息和同步状态
    - _Requirements: 1.1, 1.2, 2.1_
  
  - [ ] 2.2 创建 syncShare 方法
    - 在 `/uniCloud-alipay/cloudfunctions/todobook-co/module/share/sync-share.js` 中实现
    - 验证同步权限和时间限制
    - 使用现有的 cloneTodoBook 工具函数更新分享模板内容
    - 更新 last_sync_at 和 sync_count 字段
    - _Requirements: 2.2, 2.3, 4.1, 4.2_
  
  - [ ] 2.3 在 share/index.js 中导出新方法
    - 添加 checkShareStatus 和 syncShare 的导出
    - 确保方法在 todobook-co 主文件中可访问
    - _Requirements: 1.1, 2.2_

- [ ] 3. 修改前端分享逻辑
  - [ ] 3.1 扩展 useShareData.js
    - 添加 checkShareStatus 方法调用云函数
    - 添加 syncShare 方法处理同步请求
    - 处理同步相关的错误码
    - _Requirements: 1.1, 2.2, 3.2_
  
  - [ ] 3.2 修改 ShareDialog.vue 的打开逻辑
    - 在 open 方法中先调用 checkShareStatus
    - 根据返回结果决定显示模式（创建分享或同步）
    - 保存分享状态信息供后续使用
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [ ] 3.3 在 ShareDialog.vue 中添加同步界面
    - 创建同步模式的 UI 布局
    - 显示上次同步时间
    - 添加同步按钮和状态提示
    - 处理 24 小时限制的 UI 反馈
    - _Requirements: 1.3, 2.1, 2.4, 3.3_

- [ ] 4. 实现同步操作流程
  - [ ] 4.1 实现同步按钮点击处理
    - 在 ShareDialog.vue 中添加 handleSyncShare 方法
    - 调用 syncShare 并处理响应
    - 显示同步进度（loading 状态）
    - _Requirements: 3.1, 3.2_
  
  - [ ] 4.2 处理同步结果
    - 成功时显示成功提示和更新后的同步时间
    - 失败时显示具体错误信息
    - 处理 24 小时限制的特殊提示
    - _Requirements: 3.2, 3.3, 3.4_

- [ ] 5. 完善用户体验细节
  - [ ] 5.1 添加时间格式化工具
    - 创建格式化显示"上次同步时间"的工具函数
    - 显示友好的时间格式（如"3小时前"）
    - _Requirements: 3.3_
  
  - [ ] 5.2 添加倒计时显示
    - 当不能同步时，显示剩余等待时间
    - 实现倒计时更新逻辑
    - _Requirements: 2.1, 3.3_
  
  - [ ] 5.3 优化错误提示
    - 为不同错误场景提供清晰的用户指引
    - 确保错误信息友好且可操作
    - _Requirements: 3.3, 3.4_

- [ ] 6. 集成和验证
  - [ ] 6.1 部署云函数更新
    - 上传并部署所有云函数修改
    - 验证云函数正常运行
    - _Requirements: 所有后端需求_
  
  - [ ] 6.2 端到端功能验证
    - 创建分享 → 修改内容 → 同步流程
    - 验证 24 小时限制
    - 验证数据完整性
    - _Requirements: 所有需求_