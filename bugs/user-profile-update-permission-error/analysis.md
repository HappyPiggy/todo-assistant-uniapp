# 根因分析

## Root Cause
通过分析代码和日志，问题的根本原因在于：

1. **权限配置冲突**：编辑资料页面在更新用户信息后，uni-id-pages 的 store.js 中的 `updateUserInfo` 方法尝试使用 clientDB 直接访问 `uni-id-users` 表，但该表的 schema 权限配置要求特定权限才能进行更新操作。

2. **重复更新逻辑**：用户资料更新存在两套更新机制：
   - 编辑页面调用 `user-co` 云函数的 `updateProfile` 方法（成功执行）
   - 编辑页面调用 `mutations.updateUserInfo(this.formData)` 又触发了 clientDB 更新（权限失败）

3. **前端状态不同步**：虽然云函数更新成功，但由于 clientDB 更新失败，前端用户信息状态没有正确更新。

## Affected Code Locations

### 1. 编辑资料页面 `/pages/ucenter/profile/edit.vue:208`
```javascript
// 更新本地用户信息
await mutations.updateUserInfo(this.formData)
```

### 2. uni-id-pages store `/uni_modules/uni-id-pages/common/store.js:20`
```javascript
usersTable.where('_id==$env.uid').update(data).then(e => {
    // 这里使用 clientDB 直接更新用户表，触发权限校验错误
})
```

### 3. uni-id-users schema 权限配置
```json
"update": "doc._id == auth.uid || 'UPDATE_UNI_ID_USERS' in auth.permission"
```

## Fix Strategy

**主要修复方案**：修改编辑资料页面的更新逻辑，避免使用 clientDB 更新用户表，改为直接更新本地存储的用户信息。

具体修复步骤：
1. 在 `user-co` 云函数更新成功后，直接调用 `mutations.setUserInfo()` 方法更新本地用户信息
2. 移除对 `mutations.updateUserInfo(data)` 的调用，避免触发 clientDB 更新
3. 确保前端用户信息状态与后端数据保持一致

**技术实现**：
- 使用 `mutations.setUserInfo(updatedData)` 替代 `mutations.updateUserInfo(this.formData)`
- 确保传递给 `setUserInfo` 的数据包含所有必要的用户信息字段
- 保持现有的云函数更新逻辑不变（已经工作正常）

## Alternative Solutions

**方案二**：修改 uni-id-users 表的权限配置，允许用户更新自己的资料字段，但这可能带来安全风险。

**方案三**：完全重构用户信息更新流程，统一使用云函数处理所有用户信息更新，但这需要更大的代码改动。

选择方案一是因为它：
- 修改最小，风险最低
- 保持了现有的安全模型
- 解决了核心问题（重复更新和权限冲突）