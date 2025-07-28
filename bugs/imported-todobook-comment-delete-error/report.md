# Bug Report: 导入分享项目册后无法删除评论

## Bug Description
导入他人分享的项目册后，其中的任务评论可以正常查看并显示匿名用户名，但无法删除这些评论，删除操作会报错"评论不存在"。

## Reproduction Steps
1. 用户A创建TodoBook并添加任务
2. 用户A在任务中添加评论
3. 用户A分享该TodoBook
4. 用户B通过分享码导入该TodoBook
5. 用户B查看任务详情，可以看到评论显示为匿名用户
6. 用户B尝试删除该评论
7. 系统报错：[deleteTaskComment]，返回结果：{"code":404,"message":"评论不存在"}

## Expected Behavior
- 导入分享的TodoBook后，导入用户有最高权限，能够正常删除任务中的匿名用户评论


## Actual Behavior
- 评论可以正常显示，显示为匿名用户名
- 点击删除按钮后，后端返回404错误："评论不存在"
- 具体错误信息：`[deleteTaskComment]，请求参数： 6881ed46035dda0fd0c9fb9a_1753350099845_313s2y6cs`

## Environment
- 项目类型：uni-app + Vue 3 + uniCloud
- 云端：uniCloud Aliyun版本
- 数据库：MongoDB (uniCloud DB)
- 涉及功能：TodoBook分享导入功能

## Impact and Severity
- **影响范围**：所有导入分享TodoBook的用户
- **严重程度**：Medium
- **用户体验影响**：中等，用户无法管理导入后的评论内容，可能造成困惑
- **功能完整性**：影响评论管理功能的完整性

## Additional Information
- 错误发生在云函数 `todobook-co` 的 `deleteTaskComment` 方法
- 请求参数格式：`6881ed46035dda0fd0c9fb9a_1753350099845_313s2y6cs`（看起来是评论ID）
- 可能涉及权限检查或数据关联问题