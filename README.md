# 土豆记录册 - 层级化任务管理应用

基于 uni-app + Vue 3 + uniCloud 构建的现代化待办事项管理应用，支持分层级的任务管理和云端同步。

## 🚀 功能特性

### 📋 核心功能
- **分层级任务管理**：支持 TodoBook → TodoItem → SubItem 三级结构
- **实时云端同步**：基于 uniCloud 的数据同步机制
- **多平台支持**：H5、小程序、原生应用一套代码多端运行
- **离线操作**：网络断开时支持离线编辑，连网后自动同步

### 🎯 项目册管理
- 创建、编辑、删除项目册
- 项目册颜色和图标自定义
- 项目册共享和成员管理
- 项目进度统计和可视化

### ✅ 任务管理  
- 任务创建、编辑、删除
- 任务状态管理（待办、进行中、已完成）
- 优先级设置（低、中、高、紧急）
- 截止日期和工时估算
- 子任务支持
- 标签和分类

### 📊 数据统计
- 任务完成率统计
- 优先级分布图表
- 活动日历热力图
- 项目进度可视化

### ⚙️ 同步机制
- 手动同步和自动同步
- 冲突检测和解决
- 增量同步优化
- 同步状态实时显示

## 🏗️ 技术架构

### 前端技术栈
- **框架**：uni-app + Vue 3
- **组件库**：uni-ui
- **状态管理**：自定义 Store (基于 Vue 3 Composition API)
- **样式**：SCSS + uni-scss

### 后端技术栈
- **云平台**：uniCloud (阿里云)
- **数据库**：MongoDB (uniCloud DB)
- **云函数**：Node.js
- **认证系统**：uni-id

### 数据库设计
```javascript
// 项目册表
todobooks: {
  _id: String,
  title: String,
  description: String,
  creator_id: String,
  color: String,
  icon: String,
  is_shared: Boolean,
  member_count: Number,
  item_count: Number,
  completed_count: Number
}

// 项目册成员表
todobook_members: {
  _id: String,
  todobook_id: String,
  user_id: String,
  role: String, // owner, admin, member
  permissions: Array
}

// 任务表
todoitems: {
  _id: String,
  todobook_id: String,
  parent_id: String,
  title: String,
  description: String,
  status: String, // todo, in_progress, completed
  priority: String, // low, medium, high, urgent
  due_date: Date,
  tags: Array,
  progress: Number
}
```

## 📱 页面结构

```
pages/
├── list/list.vue                 # 项目册列表页（首页）
├── ucenter/
│   ├── ucenter.vue              # 个人中心页
│   └── profile/edit.vue         # 编辑资料页
├── todobooks/
│   ├── detail.vue               # 项目册详情页
│   ├── create.vue               # 创建项目册页
│   └── edit.vue                 # 编辑项目册页
├── tasks/
│   ├── detail.vue               # 任务详情页
│   └── create.vue               # 创建任务页
├── statistics/
│   └── overview.vue             # 数据统计页
├── login/
│   └── login-withpwd.vue        # 登录页
└── register/
    └── register.vue             # 注册页
```

## 🔧 云函数结构

```
uniCloud-alipay/cloudfunctions/
├── user-co/                     # 用户管理云对象
│   ├── index.obj.js            # 用户信息管理、设置管理
│   └── package.json
├── sync-co/                     # 同步管理云对象  
│   ├── index.obj.js            # 数据同步、冲突解决
│   └── package.json
└── todobook-co/                 # 项目册管理云对象
    ├── index.obj.js            # 项目册和任务管理
    └── package.json
```

## 🛠️ 开发环境搭建

### 环境要求
- Node.js 16+
- HBuilderX 3.8+
- uniCloud 开发者账号

### 安装步骤
1. **克隆项目**
   ```bash
   git clone <项目地址>
   cd uni-uitest
   ```

2. **配置 uniCloud**
   - 在 HBuilderX 中打开项目
   - 右键 `uniCloud-alipay` 目录，选择"关联云服务空间"
   - 按提示完成云服务空间配置

3. **部署云函数**
   - 右键各云函数目录，选择"上传部署"
   - 等待部署完成

4. **初始化数据库**
   - 在 uniCloud 控制台创建数据库集合
   - 导入 `database/db_init.json` 配置

5. **运行项目**
   - HBuilderX 中选择"运行到浏览器"或其他平台

## 📋 使用说明

### 基本使用流程

1. **注册/登录**
   - 首次使用需要注册账号
   - 支持手机号/邮箱注册

2. **创建项目册**
   - 在首页点击右下角"+"按钮
   - 填写项目册名称、描述等信息
   - 选择喜欢的颜色和图标

3. **添加任务**
   - 进入项目册详情页
   - 点击添加任务按钮
   - 设置任务标题、优先级、截止日期等

4. **管理任务**
   - 点击任务可查看详情
   - 支持状态切换、进度更新
   - 可添加子任务和评论

5. **数据同步**
   - 在个人中心可手动触发同步
   - 支持自动同步设置
   - 网络恢复时自动同步离线数据

### 同步策略

- **进入项目册时同步**：获取最新数据
- **退出项目册时同步**：保存本地修改
- **手动同步**：用户主动触发
- **冲突解决**：服务器优先策略

## 🔄 数据同步机制

### 同步时机
1. 应用启动时（可配置）
2. 进入/退出项目册时
3. 网络状态变化时
4. 用户手动触发
5. 定时自动同步（可配置）

### 冲突处理
- **检测机制**：基于时间戳比较
- **解决策略**：服务器优先、客户端优先、用户选择
- **合并策略**：字段级合并

### 离线支持
- 本地数据存储
- 变更队列管理
- 网络恢复时批量同步
- 失败重试机制

## 📈 性能优化

### 前端优化
- 组件懒加载
- 图片压缩和缓存
- 列表虚拟滚动
- 数据分页加载

### 后端优化
- 数据库索引优化
- 云函数冷启动优化
- 批量操作支持
- 增量数据同步

### 存储优化
- 本地数据压缩
- 过期数据清理
- 缓存容量限制
- 存储配额监控

## 🚦 项目状态

### ✅ 已完成功能
- [x] 用户认证系统
- [x] 项目册管理
- [x] 任务管理系统
- [x] 数据同步机制
- [x] 状态管理系统
- [x] 本地存储管理
- [x] 统计页面
- [x] 响应式设计
- [x] 现代化UI界面

### 🔄 进行中功能
- [ ] 全面测试覆盖
- [ ] 性能优化
- [ ] 错误处理完善

### 📝 待开发功能
- [ ] 团队协作功能
- [ ] 文件附件支持
- [ ] 消息通知系统
- [ ] 数据导入导出
- [ ] 主题切换功能
- [ ] 多语言支持

## 🐛 已知问题

1. **同步冲突处理**：复杂冲突场景需要更完善的解决方案
2. **离线功能**：某些边界情况下的数据一致性问题
3. **性能优化**：大数据量下的列表渲染性能有待优化

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 开源协议

本项目基于 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

## 📞 联系方式

- 项目作者：[您的姓名]
- 邮箱：[您的邮箱]
- 项目链接：[项目GitHub地址]

## 🙏 致谢

- [uni-app](https://uniapp.dcloud.io/) - 跨平台应用开发框架
- [uniCloud](https://unicloud.dcloud.net.cn/) - 云开发平台
- [uni-ui](https://uniapp.dcloud.io/component/README) - UI组件库
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架