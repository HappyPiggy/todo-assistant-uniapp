# 实施计划 - 修复安卓端下拉刷新冲突问题

## 任务拆分

### Phase 1: 准备工作

- [ ] 1. 备份当前工作状态
  - 创建功能分支 `fix/android-refresh-conflict`
  - 备份关键文件的当前状态
  - _需求: 需求1, 需求2_

### Phase 2: VirtualTaskList 组件改造

- [ ] 2. 更新 VirtualTaskList 组件 Props 和 Events
  - 添加 `refreshing` prop 用于控制刷新状态
  - 添加 `refresh` event 用于向父组件传递刷新请求
  - _需求: 需求1_

- [ ] 3. 修改 scroll-view 配置
  - 将 `bounces` 从 `false` 改为 `true` 
  - 启用 `refresher-enabled: true`
  - 添加 `refresher-triggered`、`refresher-threshold` 等配置
  - 绑定 `@refresherrefresh` 和 `@refresherrestore` 事件
  - _需求: 需求1_

- [ ] 4. 实现刷新事件处理逻辑
  - 实现 `handleRefresh` 方法，向父组件发送刷新事件
  - 实现 `handleRefreshRestore` 方法，处理刷新完成
  - _需求: 需求1_

### Phase 3: detail.vue 页面改造

- [ ] 5. 移除页面级下拉刷新配置
  - 在 `pages.json` 中移除 `todobooks/detail` 页面的 `enablePullDownRefresh: true`
  - 移除 `onPullDownRefresh` 生命周期监听
  - _需求: 需求1_

- [ ] 6. 更新 VirtualTaskList 组件使用
  - 添加 `:refreshing` prop 绑定
  - 添加 `@refresh` 事件监听
  - _需求: 需求1_

- [ ] 7. 实现新的刷新状态管理
  - 添加 `refreshing` 响应式变量
  - 实现 `handleRefresh` 方法处理组件刷新事件
  - 保持原有的评论缓存清理和数据刷新逻辑
  - _需求: 需求1, 需求2_

### Phase 4: 测试与验证

- [ ] 8. 功能测试
  - 安卓端下拉刷新功能测试
  - iOS 端下拉刷新功能回归测试
  - H5 端下拉刷新功能回归测试
  - _需求: 需求1_

- [ ] 9. 性能测试
  - 虚拟滚动性能测试（大量任务数据）
  - 任务项复用机制验证
  - 滚动流畅度测试
  - _需求: 需求2_

- [ ] 10. 数据完整性测试
  - 下拉刷新后任务数据更新验证
  - 评论缓存清理和重建测试
  - 筛选状态保持测试
  - _需求: 需求1, 需求2_

### Phase 5: 优化与完善

- [ ] 11. 错误处理优化
  - 刷新失败时的用户提示
  - 网络异常时的降级处理
  - _需求: 需求1_

- [ ] 12. 用户体验优化
  - 刷新动画效果调优
  - 加载状态提示优化
  - _需求: 需求1_


## 实施注意事项

### 关键风险点
1. **bounces 属性变更**：从 false 改为 true 可能影响滚动体验，需重点测试
2. **跨平台一致性**：确保 iOS、安卓、H5 三端刷新体验一致
3. **虚拟滚动稳定性**：确保改动不影响现有的虚拟滚动性能

### 回滚方案
- 如果出现问题，可以快速回滚到页面级 `onPullDownRefresh` 方案
- 保留原始代码注释，便于快速恢复

### 测试重点
- 安卓端各版本兼容性测试
- 大数据量下的滚动和刷新性能测试
- 网络异常情况下的刷新行为测试