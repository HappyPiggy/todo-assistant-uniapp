# Bug Report: Permission Check Logic

## Bug Description
需要验证 `/uniCloud-alipay/cloudfunctions/sync-co/module/utils/permission.js` 中 `checkTodoBookPermission` 函数的权限检查逻辑是否正确实现了预期的权限控制。

## Reproduction Steps
1. 调用 `checkTodoBookPermission` 函数，传入不同的用户角色和权限类型
2. 测试以下场景：
   - 创建者访问自己的 TodoBook
   - 成员访问 TodoBook
   - 非成员访问 TodoBook
   - 对归档的 TodoBook 进行写操作
   - 成员尝试删除 TodoBook

## Expected Behavior
- 创建者应该拥有所有权限（读、写、删除），但归档后不能写操作
- 成员应该拥有读写权限，但不能删除，归档后不能写操作
- 非成员应该没有任何权限
- 任何用户对归档的 TodoBook 都不能进行写操作

## Actual Behavior
需要验证当前代码逻辑是否正确实现了上述权限控制。

## Environment
- Platform: uniCloud (Alipay version)
- Function: sync-co cloud object
- File: /uniCloud-alipay/cloudfunctions/sync-co/module/utils/permission.js

## Impact and Severity
**Severity: High**
- 权限控制是应用安全的核心部分
- 错误的权限检查可能导致数据泄露或未授权的修改
- 影响所有使用 TodoBook 的用户