# Bug Report: 导入分享项目册评论隐私化问题

## Bug Description
导入他人分享的项目册时，任务中的评论显示了原评论人的真实昵称和头像，缺乏隐私保护。需要将评论人信息匿名化为"用户A"、"用户B"等形式，同时确认导入者对这些评论应具有完全管理权限。

## Reproduction Steps
1. 用户A创建一个TodoBook并添加任务
2. 在任务中添加评论（显示用户A的真实昵称和头像）
3. 用户A分享该TodoBook给用户B
4. 用户B导入该分享的TodoBook
5. 用户B查看导入的任务中的评论
6. 观察评论显示的用户信息

## Expected Behavior
- 导入的评论中，原评论人的昵称应显示为匿名形式（如"用户A"、"用户B"等）
- 原评论人的头像应使用默认头像或匿名头像
- 导入者应具有对所有导入评论的完全管理权限（删除、修改）
- 评论的时间和内容保持不变

## Actual Behavior
- 导入的评论仍显示原评论人的真实昵称和头像
- 存在隐私泄露风险
- 导入者对评论的权限状态需要确认

## Environment
- 项目类型：uni-app + Vue 3 + uniCloud
- 功能模块：TodoBook分享和导入功能
- 涉及文件：`/specs/todobook-sharing`目录下的相关文件
- 数据库：MongoDB (uniCloud DB)

## Impact and Severity
- **影响范围**：所有使用TodoBook分享功能的用户
- **隐私风险**：中等 - 可能泄露用户真实昵称和头像信息
- **用户体验**：中等 - 影响导入者对评论的管理能力
- **严重程度**：Medium - 功能可用但存在隐私和权限问题

## Additional Notes
- 需要确认当前导入者对评论的权限级别
- 需要设计合适的匿名化策略
- 需要考虑评论权限的继承机制