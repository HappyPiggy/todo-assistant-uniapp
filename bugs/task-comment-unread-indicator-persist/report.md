# Bug Report

## Bug Description
在TodoBook详情页面(pages/todobooks/detail.vue)中，当任务存在未读评论时会显示未读提示点。用户点击任务进入详情页面查看评论后，返回到详情页面时，任务项的未读提示点仍然显示，没有消失。这表明评论缓存可能没有正确刷新。

## Reproduction Steps
1. 打开TodoBook详情页面(pages/todobooks/detail.vue)
2. 观察到某个任务存在未读评论，显示未读提示点
3. 点击该任务，进入任务详情页面
4. 在任务详情页面查看评论（理论上应该标记为已读）
5. 返回到TodoBook详情页面
6. 观察任务项的未读提示点状态

## Expected Behavior
当用户从任务详情页面返回到TodoBook详情页面时，如果评论已被标记为已读，任务项的未读提示点应该消失。

## Actual Behavior
用户从任务详情页面返回后，任务项的未读提示点仍然显示，表明未读状态没有被正确更新，可能是评论缓存没有刷新导致的。

## Environment
- 项目: uni-app + Vue 3 + uniCloud
- 框架: uni-app
- 云平台: uniCloud Aliyun版本
- 相关页面: pages/todobooks/detail.vue
- 相关组件: VirtualTaskList.vue
- 状态管理: Vue 3 Composition API

## Impact and Severity
**严重程度: Medium**

**影响:**
- 用户体验问题：用户已经查看了评论，但界面仍显示未读状态，造成困惑
- 数据一致性问题：前端显示状态与实际数据状态不符
- 缓存管理问题：可能涉及评论缓存的清理机制

**业务影响:**
- 影响用户对评论状态的准确判断
- 可能导致用户重复查看已读评论
- 降低应用的整体用户体验