# 分析文档：分享功能缺失预算和实际花费字段

## Root Cause
在 `/uniCloud-alipay/cloudfunctions/todobook-co/module/share/utils/todobook-cloner.js` 文件中，`cloneTodoBook` 函数在第152-184行克隆任务数据时，没有包含 `budget` 和 `actual_cost` 字段。

具体问题：
- 克隆函数只复制了部分任务字段（title、description、status等）
- 遗漏了财务相关字段：`budget`（预算）和 `actual_cost`（实际花费）
- 这导致通过分享功能导入的TodoBook中，所有任务的财务信息丢失

## Affected Code Locations
1. **主要文件**：`/uniCloud-alipay/cloudfunctions/todobook-co/module/share/utils/todobook-cloner.js`
   - 第156-184行：`newTaskData` 对象构建部分缺少财务字段

2. **数据库模式定义**：`/uniCloud-alipay/database/todoitems.schema.json`
   - 第136-146行：定义了 `budget` 和 `actual_cost` 字段

3. **前端使用**：
   - `/pages/tasks/form.vue`：任务表单中使用这些字段
   - `/pages/tasks/detail.vue`：任务详情中展示这些字段

## Fix Strategy
1. **立即修复**：在 `todobook-cloner.js` 的任务克隆逻辑中，添加缺失的财务字段：
   ```javascript
   budget: originalTask.budget || null,
   actual_cost: originalTask.actual_cost || 0,
   ```

2. **长期改进**：为防止未来出现类似问题，需要：
   - 在数据库schema文件中添加注释，标明哪些字段需要在克隆时同步
   - 在克隆函数中添加注释，提醒开发者在修改schema时同步更新克隆逻辑
   - 考虑实现自动化测试，验证克隆功能的完整性

3. **具体实施**：
   - 在 `todoitems.schema.json` 中为每个需要克隆的字段添加 `"cloneable": true` 标记
   - 在 `todobook-cloner.js` 顶部添加警告注释，提醒查看schema变更
   - 添加字段完整性检查的辅助函数

## Alternative Solutions
1. **全量复制方案**：使用解构操作符复制所有字段，然后只覆盖需要修改的字段。这样可以避免遗漏字段，但需要更仔细地管理哪些字段不应该被复制。

2. **字段白名单方案**：定义一个需要复制的字段列表，通过遍历列表来构建新任务数据。这样更容易维护和扩展。

选择当前策略的原因：
- 最小化改动，降低引入新问题的风险
- 保持代码的显式性，清楚地表明哪些字段被复制
- 符合现有代码风格和结构