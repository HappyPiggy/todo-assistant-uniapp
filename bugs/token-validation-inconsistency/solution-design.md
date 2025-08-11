# 解决方案设计：Token验证一致性修复

## 解决方案选择

基于根本原因分析，推荐采用 **方案1：被动修复** + **局部优化**，原因如下：

1. **影响最小**：不改变现有架构，仅修复不一致问题
2. **风险可控**：修改范围有限，测试成本低
3. **快速实施**：可以立即解决用户体验问题

## 核心设计思路

### 1. Token状态检查机制统一

**目标：** 让ucenter.vue页面具备与list.vue页面相同的Token验证能力

**实现策略：**
- 为ucenter.vue添加主动Token验证逻辑
- 在页面onShow时进行Token有效性检查
- Token失效时同步更新本地状态并显示登录提示

### 2. 增强useAuthState组合函数

**当前问题：**
```javascript
// useAuthState.js 当前实现 - 仅检查本地状态
const isGuest = computed(() => {
  const hasLogin = store.hasLogin  // 仅本地检查
  return !hasLogin
})
```

**优化方案：**
添加主动Token验证方法，供需要实时验证的页面调用

### 3. 错误处理标准化

**目标：** 统一Token失效时的用户体验

**标准流程：**
1. 检测到Token失效
2. 清空本地登录状态  
3. 发送全局状态变更事件
4. 显示统一的登录提示
5. 引导用户重新登录

## 详细实现方案

### 步骤1：增强useAuthState组合函数

**文件：** `composables/useAuthState.js`

**新增功能：**
```javascript
// 新增主动Token验证方法
const validateTokenStatus = async () => {
  if (!store.hasLogin) return { valid: false, reason: 'not_logged_in' }
  
  try {
    // 通过简单的云函数调用验证Token
    const result = await uniCloud.callFunction({
      name: 'uni-id-co',
      data: {
        action: 'checkToken'
      }
    })
    
    if (result.result.code === 0) {
      return { valid: true }
    } else {
      // Token失效，清理本地状态
      await mutations.logout()
      return { valid: false, reason: 'token_expired' }
    }
  } catch (error) {
    console.error('Token验证失败:', error)
    return { valid: false, reason: 'network_error' }
  }
}
```

### 步骤2：修改ucenter.vue页面

**文件：** `pages/ucenter/ucenter.vue`

**修改内容：**

1. **导入增强的useAuthState**
2. **在onShow生命周期添加Token验证**
3. **添加Token失效处理逻辑**

**关键修改：**
```javascript
// 在<script setup>中添加
const { isGuest, validateTokenStatus } = useAuthState()
const tokenValidationStatus = ref('checking') // 'checking', 'valid', 'invalid'

// 修改onShow生命周期
onShow(async () => {
  // 设置页面标题
  const prefix = getPageTitlePrefix()
  uni.setNavigationBarTitle({
    title: `${prefix}个人中心`
  })
  
  // 如果用户已登录，验证Token状态
  if (store.hasLogin) {
    tokenValidationStatus.value = 'checking'
    const validation = await validateTokenStatus()
    
    if (!validation.valid) {
      tokenValidationStatus.value = 'invalid'
      // 显示Token失效提示
      showTokenExpiredModal()
    } else {
      tokenValidationStatus.value = 'valid'
    }
  }
})

// 新增Token失效提示方法
const showTokenExpiredModal = () => {
  uni.showModal({
    title: '登录状态已过期',
    content: '您的登录状态已过期，请重新登录以继续使用完整功能',
    confirmText: '重新登录',
    cancelText: '以访客模式继续',
    success: (res) => {
      if (res.confirm) {
        handleLogin()
      }
    }
  })
}
```

### 步骤3：优化loading状态显示

**目标：** 在Token验证期间显示适当的loading状态

**实现：**
```vue
<template>
  <view class="center">
    <!-- Token验证中的loading状态 -->
    <view v-if="tokenValidationStatus === 'checking' && hasLogin" class="token-checking-overlay">
      <uni-load-more status="loading" />
      <text class="checking-text">验证登录状态...</text>
    </view>
    
    <!-- 原有内容 -->
    <!-- ... -->
  </view>
</template>
```

## 实现时序图

```
用户访问ucenter.vue
         ↓
      onShow触发
         ↓
   检查store.hasLogin
         ↓
    [如果已登录]
         ↓
  调用validateTokenStatus()
         ↓
      云函数验证
         ↓
   [Token有效] → 正常显示页面
         ↓
   [Token失效] → 清空本地状态 → 显示重新登录模态框
```

## 优化点

### 1. 缓存机制
- 添加Token验证结果缓存，避免频繁验证
- 设置合理的缓存时间（如5分钟）

### 2. 错误处理
- 网络错误时的降级策略
- 验证超时的处理

### 3. 用户体验
- 验证过程中的loading状态
- 清晰的错误提示文案

## 测试计划

### 测试场景
1. **正常Token状态**：验证页面显示正常
2. **Token过期**：验证清空状态并提示登录
3. **网络异常**：验证降级处理
4. **并发访问**：多页面同时验证的处理

### 验证方法
1. 手动修改Token使其失效
2. 模拟网络异常
3. 快速切换页面测试并发场景

## 风险评估

### 实施风险
- **低风险**：修改范围小，不影响核心架构
- **测试复杂度**：需要模拟Token过期场景

### 性能影响
- **微小影响**：每次进入ucenter页面增加一次Token验证请求
- **优化措施**：添加缓存机制减少不必要的验证

## 后续优化方向

1. **全局Token监控**：建立全应用的Token状态监控
2. **自动刷新机制**：Token即将过期时自动刷新
3. **离线模式支持**：网络异常时的graceful degradation

## 实施计划

1. **阶段1**：增强useAuthState组合函数
2. **阶段2**：修改ucenter.vue页面逻辑  
3. **阶段3**：添加loading和错误处理
4. **阶段4**：全面测试和优化