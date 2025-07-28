# Bug Report

## Bug Description
导入他人分享的项目册时，后端云函数报错："Cannot find module '../../common/constants'"，导致控制台出现错误日志，虽然功能仍能正常工作但存在模块路径解析问题。

## Reproduction Steps
1. 在分享管理页面，点击导入按钮
2. 输入有效的分享码
3. 点击导入
4. 查看控制台日志

## Expected Behavior
- 导入分享的项目册应该成功且无错误日志输出
- 云函数执行过程中不应该出现模块找不到的错误

## Actual Behavior
- 项目册成功导入（功能正常）
- 但控制台输出模块解析错误：
```
克隆项目册失败: uniCloud-alipay/cloudfunctions/todobook-co/module/share/utils/todobook-cloner.js:204:12
Error: Cannot find module '../../common/constants'
Require stack:
- D:\uni_project\uni-uitest\uniCloud-alipay\cloudfunctions\todobook-co\module\share\utils\todobook-cloner.js
    at Module._resolveFilename [as _oldResolveFilename] (node:internal/modules/cjs/loader:1140:15)
    at Function.resolve (node:internal/modules/helpers:188:19)
    at cloneTodoBook (D:\uni_project\uni-uitest\uniCloud-alipay\cloudfunctions\todobook-co\module\share\utils\todobook-cloner.js:181:48)
```

## Environment
- **Platform**: uni-app + uniCloud
- **Runtime**: Node.js (uniCloud environment)
- **File**: `uniCloud-alipay/cloudfunctions/todobook-co/module/share/utils/todobook-cloner.js`
- **Line**: 181/204

## Impact and Severity
- **Impact**: 中等 - 功能正常但有错误日志，可能影响调试和监控
- **Severity**: Medium - 不影响用户功能但需要修复以保证代码质量和稳定性