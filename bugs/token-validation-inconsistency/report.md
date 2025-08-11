# Bug Report: Token验证失败提示不一致

## Bug Description

在用户Token过期或验证失败的情况下，list.vue页面会提示"需要登录，token验证失败"，但用户切换到ucenter.vue页面后，仍能看到用户信息且不会提示需要登录，存在登录状态检查不一致的问题。

## Reproduction Steps

1. 打开应用，正常登录
2. 等待Token过期或手动使Token失效
3. 访问 `/pages/list/list.vue` 页面
4. 观察页面提示"需要登录，token验证失败"
5. 切换到 `/pages/ucenter/ucenter.vue` 页面
6. 观察页面仍显示用户信息，无登录提示

## Expected Behavior

当Token验证失败时，所有页面应该有一致的行为：
- 要么都检测到Token失效并提示需要登录
- 要么都能正常显示内容（如果使用缓存机制）

## Actual Behavior

- list.vue页面：检测到Token失效，提示需要登录
- ucenter.vue页面：未检测到Token失效，继续显示用户信息

## Environment

- 框架：uni-app + Vue 3
- 认证系统：uni-id-pages
- 状态管理：自定义Store (基于Vue reactive API)
- 平台：Web/小程序/App通用

## Impact and Severity

**严重程度：Medium**

**影响：**
- 用户体验不一致，容易产生困惑
- 可能导致用户误以为某些功能正常可用
- 不影响核心功能，但影响用户对应用状态的准确感知

## Technical Analysis

通过代码分析发现两个页面的认证逻辑实现存在差异：

### list.vue页面
- 使用 `dataAdapter.getTodoBooks()` 获取数据，该方法会调用云端接口
- 云端接口调用时会进行Token验证，失败时抛出错误
- 页面捕获错误并显示"需要登录"提示

### ucenter.vue页面  
- 直接使用 `store.userInfo` 和 `store.hasLogin` 获取用户信息
- 这些数据来自本地缓存，不进行实时Token验证
- 仅依赖本地登录状态，不检查Token有效性

### 关键代码位置
- `list.vue:248` - 调用 `dataAdapter.getTodoBooks()` 进行数据获取
- `list.vue:173-177` - 使用 `store.hasLogin` 计算登录状态
- `ucenter.vue:175-176` - 直接使用 `store.userInfo` 和 `store.hasLogin`
- `composables/useAuthState.js:66-79` - 登录状态计算逻辑