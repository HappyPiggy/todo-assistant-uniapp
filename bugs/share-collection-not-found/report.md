# Bug Report

## Bug Description
当用户尝试分享项目册时，后端云函数报错"FaasError: not found collection"，导致分享功能无法正常使用。

## Reproduction Steps
1. 用户登录应用
2. 进入项目册详情页面
3. 点击分享功能按钮
4. 选择分享选项（包含或不包含评论）
5. 确认创建分享

## Expected Behavior
系统应该成功创建分享记录，生成分享码，并返回成功响应。

## Actual Behavior
后端云函数在执行 `createShare` 方法时抛出异常：
- 错误信息：`FaasError: not found collection`
- 错误位置：`uniCloud-alipay/cloudfunctions/todobook-co/module/share/create-share.js:74:12`
- 请求参数：`688776da095d887bc06dca32 false`

## Environment
- 云函数：todobook-co
- 方法：createShare
- 云端环境：uniCloud-alipay
- 数据库：MongoDB (uniCloud DB)
- 运行模式：本地调试

## Impact and Severity
**Severity: High**

- **Impact**: 分享功能完全不可用，影响用户协作体验
- **User Impact**: 用户无法分享项目册给其他人
- **Business Impact**: 核心协作功能受阻，可能导致用户流失
- **Scope**: 所有用户的分享操作都会失败