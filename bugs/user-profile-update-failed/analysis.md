# Bug 分析

## 根本原因
问题的根本原因是在 `/pages/ucenter/profile/edit.vue:208` 中，代码调用了 `store.updateUserInfo(this.formData)`，但实际上应该调用 `mutations.updateUserInfo(this.formData)`。

通过分析项目代码结构发现：
1. `store` 对象只包含响应式数据（`userInfo` 和 `hasLogin`）
2. 所有修改用户信息的方法都定义在 `mutations` 对象中
3. 其他文件中都正确使用了 `mutations.updateUserInfo()` 方法

## 受影响的代码位置
- **主要问题文件**：`/pages/ucenter/profile/edit.vue:208`
  - 错误调用：`await store.updateUserInfo(this.formData)`
  - 正确调用：`await mutations.updateUserInfo(this.formData)`

- **导入缺失**：`/pages/ucenter/profile/edit.vue:108`
  - 当前导入：`import { store } from '@/uni_modules/uni-id-pages/common/store.js'`
  - 需要导入：`import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'`

## 修复策略
1. **修改导入语句**：在 `edit.vue` 中同时导入 `store` 和 `mutations`
2. **修正方法调用**：将 `store.updateUserInfo()` 改为 `mutations.updateUserInfo()`
3. **保持一致性**：确保与项目中其他文件的用法保持一致

具体修改：
- 第108行：`import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'`
- 第208行：`await mutations.updateUserInfo(this.formData)`

## 替代解决方案
虽然主要方案是修正方法调用，但还有以下替代方案：
1. **直接调用云函数**：跳过本地 store 更新，直接处理云函数返回的用户信息
2. **创建包装方法**：在 store 对象上添加 updateUserInfo 方法作为 mutations.updateUserInfo 的代理

选择当前策略的原因：
- 保持代码一致性，与项目其他部分的用法统一
- 最小化更改，只修改错误的调用方式
- 充分利用现有的 mutations.updateUserInfo 逻辑