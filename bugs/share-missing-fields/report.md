# Bug Report: 分享功能缺失预算和实际花费字段

## Bug Description
TodoBook分享功能未正确分享预算(budget)和实际花费(actualExpense)字段，可能还有其他字段也未被正确分享。

## Reproduction Steps
1. 创建一个TodoBook，设置预算和实际花费数值
2. 使用分享功能分享该TodoBook
3. 其他用户通过分享码加入TodoBook
4. 新加入的用户查看TodoBook详情

## Expected Behavior
- 新加入的用户应该能看到完整的TodoBook信息，包括：
  - 基本信息（名称、描述等）
  - 预算(budget)字段
  - 实际花费(actualExpense)字段
  - 其他所有相关字段

## Actual Behavior
- 新加入的用户无法看到预算和实际花费字段
- 可能还有其他字段也未被正确分享

## Environment
- 应用框架：uni-app + Vue 3
- 云服务：uniCloud alipay版本
- 数据库：MongoDB
- 相关模块：分享功能模块(share module)

## Impact and Severity
- **影响**：用户无法查看完整的TodoBook财务信息，影响团队协作中的预算管理功能
- **严重程度**：高 - 核心功能数据丢失，影响用户体验和产品可用性