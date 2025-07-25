# 技术方案设计 - 项目册分享功能

## 架构概述

基于现有的uni-app + uniCloud架构，扩展分享功能模块。采用云端模板存储 + 快照克隆的方式实现项目册分享，确保数据隔离和安全性。

## 技术栈

### 前端技术
- **框架**: uni-app (Vue 3 Composition API)
- **UI组件**: uni-ui组件库
- **状态管理**: 基于Vue 3 reactive API的自定义store
- **样式**: SCSS + uni-scss设计系统

### 后端技术
- **云平台**: uniCloud阿里云版
- **数据库**: MongoDB (uniCloud DB)
- **云函数**: Node.js Cloud Objects
- **认证**: uni-id-common

## 数据库设计

### 新增数据表

#### 1. todobook_shares (项目册分享表)
```json
{
  "bsonType": "object",
  "required": ["share_code", "creator_id", "shared_todobook_id", "created_at"],
  "permission": {
    "read": "auth.uid != null",
    "create": "auth.uid != null && doc.creator_id == auth.uid",
    "delete": "auth.uid != null && doc.creator_id == auth.uid",
    "count": "auth.uid != null"
  },
  "properties": {
    "_id": {
      "description": "ID，系统自动生成"
    },
    "share_code": {
      "bsonType": "string",
      "pattern": "^[A-Za-z0-9]{6}$",
      "description": "6位分享码"
    },
    "creator_id": {
      "bsonType": "string",
      "description": "分享者用户ID"
    },
    "shared_todobook_id": {
      "bsonType": "string",
      "description": "云端分享模板项目册ID（包含完整的项目册信息）"
    },
    "include_comments": {
      "bsonType": "bool",
      "default": false,
      "description": "是否包含评论"
    },
    "share_count": {
      "bsonType": "int",
      "minimum": 0,
      "default": 0,
      "description": "被导入次数"
    },
    "created_at": {
      "bsonType": "timestamp",
      "description": "分享创建时间"
    },
    "last_import_at": {
      "bsonType": "timestamp",
      "description": "最后导入时间"
    }
  }
}
```

### 现有数据表扩展

#### 1. todobooks 表扩展
在现有todobooks表基础上，为了支持分享模板，需要增加以下字段：

```json
{
  "is_share_template": {
    "bsonType": "bool",
    "default": false,
    "description": "是否为分享模板"
  },
  "template_creator_id": {
    "bsonType": "string",
    "description": "模板创建者ID（仅分享模板使用）"
  },
  "template_created_at": {
    "bsonType": "timestamp",
    "description": "模板创建时间（仅分享模板使用）"
  }
}
```

### 数据表索引设计
- `share_code`: 唯一索引，用于快速查找分享模板
- `creator_id`: 普通索引，用于查询用户的分享列表
- `created_at`: 普通索引，用于排序

## API设计

### 云函数扩展 (todobook-co)

#### 1. 分享相关API模块

```javascript
// module/share/index.js
module.exports = {
  createShare: require('./create-share.js'),
  deleteShare: require('./delete-share.js'),
  getMyShares: require('./get-my-shares.js'),
  importByCode: require('./import-by-code.js'),
  getSharePreview: require('./get-share-preview.js')
}
```

#### 2. 云对象方法定义

**创建分享 (createShare)**
```javascript
async createShare(todBookId, includeComments = false) {
  // 1. 验证用户分享数量限制（最多2个）
  // 2. 创建分享模板项目册（复制原项目册结构）
  // 3. 重置所有任务状态为未完成
  // 4. 根据includeComments决定是否复制评论
  // 5. 生成6位分享码
  // 6. 创建分享记录
  // 返回: { code: 0, data: { share_code, share_id } }
}
```

**删除分享 (deleteShare)**
```javascript
async deleteShare(shareId) {
  // 1. 验证分享所有权
  // 2. 删除云端分享模板项目册
  // 3. 删除分享记录
  // 返回: { code: 0, message: "分享已删除" }
}
```

**获取我的分享列表 (getMyShares)**
```javascript
async getMyShares() {
  // 1. 查询当前用户的分享记录
  // 2. 通过shared_todobook_id关联查询分享模板项目册信息
  // 返回: { code: 0, data: [分享列表] }
}
```

**通过分享码导入 (importByCode)**
```javascript
async importByCode(shareCode) {
  // 1. 验证分享码有效性
  // 2. 获取分享模板项目册
  // 3. 克隆为新项目册（添加"来自分享"后缀）
  // 4. 设置当前用户为新项目册创建者
  // 5. 更新分享统计
  // 返回: { code: 0, data: { todobook_id } }
}
```

**获取分享预览 (getSharePreview)**
```javascript
async getSharePreview(shareCode) {
  // 1. 验证分享码
  // 2. 获取分享模板基本信息
  // 3. 统计任务数量
  // 返回: { code: 0, data: { todobook_info, task_count, creator_name } }
}
```

## 前端架构设计

### 页面结构

```
pages/
├── todobooks/
│   ├── detail.vue           # 现有详情页，添加分享菜单
│   └── components/
│       └── ShareDialog.vue  # 分享对话框组件
├── settings/
│   ├── share-management.vue # 分享管理页面
│   └── components/
│       ├── ShareList.vue    # 我的分享列表
│       └── ImportShare.vue  # 导入分享组件
└── ucenter/ucenter.vue      # 设置页面，添加分享管理入口
```

### 组件设计

#### 1. ShareDialog.vue (分享对话框)
```vue
<template>
  <uni-popup ref="popup" type="dialog">
    <view class="share-dialog">
      <view class="title">分享项目册</view>
      
      <!-- 分享设置 -->
      <view class="settings">
        <uni-list>
          <uni-list-item>
            <template #body>
              <view class="setting-item">
                <text>包含评论</text>
                <switch v-model="includeComments" />
              </view>
            </template>
          </uni-list-item>
        </uni-list>
      </view>
      
      <!-- 分享结果 -->
      <view v-if="shareCode" class="share-result">
        <view class="share-code">{{ shareCode }}</view>
        <button @click="copyShareCode" class="copy-btn">复制分享码</button>
      </view>
      
      <!-- 操作按钮 -->
      <view class="actions">
        <button @click="confirmShare" :disabled="loading">
          {{ loading ? '创建中...' : '确认分享' }}
        </button>
        <button @click="close">取消</button>
      </view>
    </view>
  </uni-popup>
</template>
```

#### 2. ShareManagement.vue (分享管理页面)
```vue
<template>
  <view class="share-management">
    <!-- 导入分享 -->
    <view class="import-section">
      <view class="section-title">导入项目册</view>
      <ImportShare @import-success="onImportSuccess" />
    </view>
    
    <!-- 我的分享 -->
    <view class="my-shares-section">
      <view class="section-title">我的分享 ({{ myShares.length }}/2)</view>
      <ShareList :shares="myShares" @delete="onDeleteShare" />
    </view>
  </view>
</template>
```

### 组合式函数设计

参考项目中`useBookData.js`的模式，创建分享功能的组合式函数：

```javascript
// pages/settings/composables/useShareData.js
import { ref } from 'vue'

export function useShareData() {
  // 响应式数据
  const myShares = ref([])
  const shareLoading = ref(false)
  const importLoading = ref(false)
  const error = ref(null)

  /**
   * 创建分享
   * @param {string} todBookId - 项目册ID
   * @param {boolean} includeComments - 是否包含评论
   * @returns {Promise<Object>} 分享结果
   */
  const createShare = async (todBookId, includeComments = false) => {
    shareLoading.value = true
    error.value = null
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.createShare(todBookId, includeComments)
      
      if (result.code === 0) {
        // 重新加载分享列表
        await loadMyShares()
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('创建分享失败:', err)
      error.value = err.message
      throw err
    } finally {
      shareLoading.value = false
    }
  }

  /**
   * 删除分享
   * @param {string} shareId - 分享ID
   */
  const deleteShare = async (shareId) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.deleteShare(shareId)
      
      if (result.code === 0) {
        // 重新加载分享列表
        await loadMyShares()
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('删除分享失败:', err)
      error.value = err.message
      throw err
    }
  }

  /**
   * 加载我的分享列表
   */
  const loadMyShares = async () => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getMyShares()
      
      if (result.code === 0) {
        myShares.value = result.data || []
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('加载分享列表失败:', err)
      error.value = err.message
      myShares.value = []
    }
  }

  /**
   * 通过分享码导入项目册
   * @param {string} shareCode - 分享码
   * @returns {Promise<Object>} 导入结果
   */
  const importByShareCode = async (shareCode) => {
    importLoading.value = true
    error.value = null
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.importByCode(shareCode)
      
      if (result.code === 0) {
        // 触发项目册列表更新
        uni.$emit('todobooks-updated')
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('导入分享失败:', err)
      error.value = err.message
      throw err
    } finally {
      importLoading.value = false
    }
  }

  /**
   * 获取分享预览
   * @param {string} shareCode - 分享码
   * @returns {Promise<Object>} 预览信息
   */
  const getSharePreview = async (shareCode) => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getSharePreview(shareCode)
      
      if (result.code === 0) {
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('获取分享预览失败:', err)
      error.value = err.message
      throw err
    }
  }

  return {
    // 响应式数据
    myShares,
    shareLoading,
    importLoading,
    error,
    
    // 方法
    createShare,
    deleteShare,
    loadMyShares,
    importByShareCode,
    getSharePreview
  }
}
```

## 安全性设计

### 1. 权限控制
- 分享码生成使用加密安全的随机算法
- 数据库权限确保用户只能操作自己的分享
- 导入时验证分享码有效性和用户权限

### 2. 数据隔离
- 分享模板与原项目册完全隔离
- 导入的项目册与分享模板无关联
- 删除分享不影响已导入的项目册

### 3. 限制策略
- 每用户最多同时分享2个项目册
- 前后端双重校验分享数量限制
- 分享码格式校验防止恶意输入

## 测试策略

### 1. 单元测试
- 分享码生成算法测试
- 数据快照创建测试
- 权限验证逻辑测试

### 2. 集成测试
- 完整分享流程测试
- 导入流程测试
- 数据隔离验证测试

### 3. 用户验收测试
- 分享功能易用性测试
- 多用户协作场景测试
- 边界条件测试（分享数量限制等）

## 性能优化

### 1. 数据库优化
- 为分享码建立唯一索引
- 为用户ID建立普通索引
- 模板数据使用JSON格式存储，减少查询复杂度

### 2. 前端优化
- 分享列表使用虚拟滚动（如数据量大）
- 分享码复制使用系统API
- 组件懒加载减少初始加载时间

### 3. 缓存策略
- 分享列表数据缓存
- 分享预览数据短期缓存
- 避免重复请求同一分享码

## 部署方案

### 1. 数据库迁移
1. 创建todobook_shares数据表
2. 创建相应索引
3. 设置权限规则

### 2. 云函数部署
1. 扩展todobook-co云函数
2. 添加分享相关模块
3. 部署并测试

### 3. 前端部署
1. 添加新页面和组件
2. 更新路由配置
3. 集成测试后发布

## 监控和维护

### 1. 监控指标
- 分享创建成功率
- 导入成功率
- 分享码重复率
- 用户分享活跃度

### 2. 日志记录
- 分享操作日志
- 导入操作日志
- 错误日志和异常监控

### 3. 数据维护
- 定期清理过期分享（如有需要）
- 监控数据库存储使用情况
- 分享使用统计分析