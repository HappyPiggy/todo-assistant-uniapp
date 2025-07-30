# Bug 报告

## Bug 描述
在个人资料编辑页面 `/pages/ucenter/profile/edit.vue` 中，当用户更新个人信息后点击保存按钮时，调用了不存在的 `store.updateUserInfo` 方法，导致保存操作失败。

## 重现步骤
1. 打开应用并登录
2. 进入个人中心页面
3. 点击编辑个人资料
4. 修改任意个人信息（如昵称、邮箱等）
5. 点击保存按钮
6. 系统尝试调用 `store.updateUserInfo(this.formData)` 方法

## 预期行为
- 用户信息应该成功保存到后端
- 本地 store 中的用户信息应该同步更新
- 显示保存成功提示
- 自动返回上一页面

## 实际行为
- 由于 `store.updateUserInfo` 方法不存在，导致 JavaScript 错误
- 保存操作失败
- 用户信息未能更新
- 可能显示错误提示或页面异常

## 环境信息
- 框架：uni-app + Vue 3
- 后端：uniCloud
- 状态管理：uni-id-pages store
- 文件位置：`/pages/ucenter/profile/edit.vue:208`

## 影响和严重程度
**严重程度：High**
- 影响：用户无法保存个人资料信息，影响基本功能使用
- 范围：所有尝试编辑个人资料的用户
- 业务影响：用户体验较差，可能导致用户流失