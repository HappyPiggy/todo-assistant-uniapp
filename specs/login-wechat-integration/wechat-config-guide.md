# 微信登录配置指南

## 1. 配置微信AppID

### 1.1 修改 uni-id-pages 配置文件

编辑 `/uni_modules/uni-id-pages/config.js`，将微信appid的占位符替换为实际的AppID：

```javascript
appid: {
  weixin: {
    // 微信公众号的appid（用于H5平台）
    h5: 'your-h5-appid',  // 替换为实际的公众号AppID
    // 微信开放平台的appid（用于网页登录）
    web: 'your-web-appid' // 替换为实际的开放平台AppID
  }
}
```

### 1.2 配置App端微信登录（manifest.json）

在 `manifest.json` 中配置App端的微信SDK：

```json
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "oauth": {
          "weixin": {
            "appid": "your-app-weixin-appid",
            "appsecret": "your-app-weixin-secret",
            "UniversalLinks": "https://your-domain.com/app/"  // iOS需要
          }
        }
      }
    }
  }
}
```

## 2. 解决云函数500错误

### 2.1 检查云函数部署状态

1. 登录uniCloud控制台
2. 检查 `uni-id-co` 云函数是否已部署
3. 如果未部署，右键点击云函数文件夹，选择"上传并部署"

### 2.2 配置云函数权限

在uniCloud控制台中：

1. 进入云函数管理
2. 找到 `uni-id-co` 云函数
3. 设置权限为"所有用户可访问"

### 2.3 检查云函数日志

在uniCloud控制台查看云函数日志，找出具体错误原因：

1. 进入云函数管理
2. 点击 `uni-id-co`
3. 查看"日志"标签页

### 2.4 配置微信登录密钥

在云函数的配置中添加微信登录所需的密钥：

1. 找到 `uniCloud-alipay/cloudfunctions/common/uni-config-center/uni-id/config.json`
2. 配置微信登录相关参数：

```json
{
  "weixin": {
    "oauth": {
      "mp": {
        "appid": "wx522ce7083ca5127e",  // 你的小程序appid
        "appsecret": "your-mp-secret"    // 小程序密钥
      },
      "h5": {
        "appid": "your-h5-appid",
        "appsecret": "your-h5-secret"
      },
      "app": {
        "appid": "your-app-appid",
        "appsecret": "your-app-secret"
      }
    }
  }
}
```

## 3. 测试步骤

### 3.1 小程序测试

1. 确保已在微信公众平台配置了合法域名
2. 将云函数域名添加到小程序的合法域名列表
3. 重新编译运行小程序

### 3.2 App测试

1. 确保已安装微信客户端
2. 重新打包App（需要自定义基座）
3. 运行测试

## 4. 常见问题

### Q1: 提示"appid参数错误"

A: 检查以下配置：
- uni-id-pages/config.js 中的appid配置
- manifest.json 中的SDK配置
- 云函数配置中的appid是否一致

### Q2: 云函数500错误

A: 可能的原因：
- 云函数未部署或部署失败
- 配置文件中的appsecret未设置
- 云函数权限设置不正确
- 网络请求被拦截（检查合法域名配置）

### Q3: 微信登录后无法获取用户信息

A: 确保：
- 已在微信开放平台/公众平台正确配置
- appsecret配置正确
- 用户已授权获取信息

## 5. 安全建议

1. **不要在前端代码中暴露appsecret**
2. **定期更新密钥**
3. **使用HTTPS协议**
4. **设置合理的云函数权限**