# CLAUDE.md

本文件为 Claude Code 在处理此代码库时提供指导。

## 项目概述

这是一个基于 **uni-app + Vue 3 + uniCloud** 的现代化待办事项管理应用，支持分层级的任务管理和实时云端同步。应用采用 B/S 架构，支持多平台部署（H5、小程序、原生应用）。

## 技术栈

### 前端架构
- **框架**: uni-app (Vue 3 Composition API)
- **UI组件**: uni-ui 组件库
- **状态管理**: 自定义 Vuex 替代方案（基于 Vue 3 reactive API）
- **样式**: SCSS + uni-scss 设计系统
- **用户认证**: uni-id-pages 认证页面模块

### 后端架构
- **云平台**: uniCloud 阿里云版本
- **数据库**: MongoDB (uniCloud DB)
- **云函数**: Node.js 云对象（Object）
- **认证系统**: uni-id-common

## 项目结构

### 核心目录
```
/
├── pages/                    # 页面文件
│   ├── list/list.vue        # 项目册列表（首页）
│   ├── ucenter/ucenter.vue  # 用户中心
│   ├── todobooks/           # 项目册相关页面
│   │   ├── detail.vue       # 项目册详情
│   │   ├── create.vue       # 创建项目册
│   │   ├── edit.vue         # 编辑项目册
│   │   └── members.vue      # 成员管理
│   ├── tasks/               # 任务相关页面
│   │   ├── detail.vue       # 任务详情
│   │   └── create.vue       # 创建任务
│   ├── statistics/          # 统计页面
│   │   └── overview.vue     # 数据统计概览
│   └── debug/debug.vue      # 数据库调试页面
├── store/                   # 状态管理
│   ├── index.js            # 主状态管理文件
│   ├── storage.js          # 本地存储管理
│   └── sync.js             # 同步逻辑
├── uniCloud-alipay/        # 云端代码
│   ├── cloudfunctions/     # 云函数
│   │   ├── todobook-co/    # 项目册管理云对象
│   │   ├── sync-co/        # 数据同步云对象
│   │   └── user-co/        # 用户管理云对象
│   └── database/           # 数据库Schema
├── uni_modules/            # uni-app 模块
├── static/                 # 静态资源
└── main.js                 # 应用入口
```


## 调试技巧与最佳实践

### 日志打印最佳实践
- 当需要打印调试日志时，值类型直接打印，对象类型使用JSON.stringify(对象变量名, null, 2)进行打印
