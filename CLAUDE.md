# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在处理此代码库时提供指导。

## 项目概述

这是一个基于 Vue 3 的 uni-app 项目，设计用于跨平台部署（H5、小程序、原生应用）。应用包含用户认证、注册和基本的用户中心功能，并集成了 uniCloud 后端。

## 开发命令

本项目使用 HBuilderX 作为主要开发环境。由于没有包含 npm 脚本的 package.json，开发通常通过 HBuilderX IDE 完成：

- **浏览器运行**：使用 HBuilderX "运行到浏览器"
- **真机运行**：使用 HBuilderX "运行到手机或模拟器"
- **构建**：使用 HBuilderX "发行" 菜单构建各平台版本
- **uniCloud 部署**：使用 HBuilderX uniCloud 发布功能

## 架构与结构

### 核心框架
- **前端**：uni-app (Vue 3) 配合 uni-ui 组件库
- **后端**：uniCloud（已配置支付宝云服务）
- **认证系统**：uni-id 系统配合 uni-id-pages 模块
- **样式**：SCSS 配合 uni-scss 设计系统

### 关键目录
- `pages/` - 应用页面（登录、注册、用户中心）
- `uni_modules/` - 模块化的 uni-app 组件和插件
- `uniCloud-alipay/` - 云函数和数据库模式
- `static/` - 静态资源（图片、图标、样式）

### 认证流程
- 登录页面：`pages/login/login-withpwd.vue`
- 注册页面：`pages/register/register.vue`
- 用户中心：`pages/ucenter/ucenter.vue`
- 通过 `uni-id-co` 云对象处理认证
- 在 `pages.json` 中通过 `uniIdRouter` 配置登录路由

### 导航结构
- 底部标签栏包含"列表"和"我的"两个标签
- 受保护的路由需要认证（在 `uniIdRouter.needLogin` 中定义）
- 设置页面可从用户中心访问

### 组件系统
广泛使用 uni-ui 组件：
- `uni-forms` 和 `uni-forms-item` 用于表单处理
- `uni-easyinput` 用于输入框
- `uni-captcha` 用于验证码
- `uni-list` 和 `uni-list-item` 用于列表
- `uni-icons` 用于图标

### 云端集成
- uniCloud 函数位于 `uniCloud-alipay/cloudfunctions/`
- 数据库模式和 JQL 查询
- 使用 `uni-id-co` 进行用户管理
- 集成了验证码和验证系统

### 样式方案
- 全局样式在 `App.vue` 和 `uni.scss` 中
- 使用 `match-media` 组件实现响应式设计
- 自定义图标字体在 `static/customicons.css`
- 使用 uni-scss 变量进行 SCSS 预处理

## 数据库 Schema 规范

### 核心表结构
- `todobooks` - 项目册表（用户创建的待办清单集合）
- `todoitems` - 任务项表（具体的待办事项）
- `todobook_members` - 成员表（项目册的协作成员）
- `user_settings` - 用户设置表（个人偏好配置）

### 权限控制规则
所有表均已配置完整的权限系统：
- **基本权限**：read、create、update、delete、count
- **权限表达式**：使用 `get()` 方法进行表关联验证，不使用 `where()` 
- **用户权限**：`doc.creator_id == auth.uid` 确保用户只能操作自己的数据
- **关联权限**：通过 `get(\`database.table.\${doc.field_id}\`)` 验证关联表权限

### 强制默认值配置
关键字段已配置 `forceDefaultValue`：
- `creator_id` → `{"$env": "uid"}` （自动设为当前用户）
- `created_at/updated_at` → `{"$env": "now"}` （自动设为当前时间）

### 索引优化
- 所有表都配置了基于查询模式的复合索引
- `user_settings.user_id` 设为唯一索引防止重复

## 重要说明

- 项目配置为 Vue 3（manifest.json 中 `"vueVersion": "3"`）
- 在 `manifest.json` 中定义了 Android 跨平台权限
- 没有传统的 npm 构建系统 - 依赖 HBuilderX 工具链
- uniCloud 后端需要正确的云函数部署
- 认证状态通过 uni-id-pages 存储系统管理
- 数据库 Schema 已按 DB Schema 概述规范配置，确保数据安全性