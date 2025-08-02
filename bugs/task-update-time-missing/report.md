# Bug Report: 任务更新时间字段缺失更新

## Bug Description
任务的"更新时间"字段仅在切换任务完成状态时更新，但在编辑任务并成功保存后不会触发此字段的更新。

## Reproduction Steps
1. 打开任务管理应用
2. 进入任一TodoBook
3. 选择一个现有任务，点击编辑
4. 修改任务的标题、描述、优先级或其他字段
5. 保存任务
6. 查看任务的"更新时间"字段
7. 对比：切换任务的完成状态，观察"更新时间"字段是否更新

## Expected Behavior
当用户编辑任务的任何字段并成功保存后，"更新时间"字段应该自动更新为当前时间戳，反映任务的最新修改时间。

## Actual Behavior
编辑并保存任务后，"更新时间"字段保持不变，仍显示之前的时间。只有在切换任务完成状态时，"更新时间"字段才会更新。

## Environment
- **Framework**: uni-app + Vue 3
- **Backend**: uniCloud + MongoDB
- **Platform**: H5/微信小程序/移动应用
- **Components**: 任务编辑表单、云函数、数据库更新逻辑

## Impact and Severity
- **Severity**: Medium
- **Impact**: 影响用户对任务最后修改时间的准确了解，可能导致团队协作中的时间追踪问题
- **User Experience**: 中等程度影响，用户无法准确知道任务何时被最后修改
- **Data Integrity**: 时间戳数据不准确，影响统计和审计功能