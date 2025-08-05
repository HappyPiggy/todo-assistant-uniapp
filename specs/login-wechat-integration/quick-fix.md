# 微信登录快速修复指南

## 🔧 立即需要做的事情

### 1. 配置微信小程序密钥

编辑文件：`/uniCloud-alipay/cloudfunctions/common/uni-config-center/uni-id/config.json`

找到第15行，将 `"请在此处填写你的小程序密钥"` 替换为你的实际小程序密钥（AppSecret）。

**获取密钥的方法**：
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入"开发" → "开发管理" → "开发设置"
3. 找到"开发者密码(AppSecret)"，点击"重置"获取

### 2. 部署云函数

在HBuilderX中：
1. 找到 `uniCloud-alipay/cloudfunctions/uni-id-co` 文件夹
2. 右键点击 → 选择"上传并部署"
3. 等待部署完成

### 3. 配置App端微信登录（如需要）

如果要在App端使用微信登录，需要：

1. 在 `manifest.json` 中添加：
```json
"app-plus": {
  "distribute": {
    "sdkConfigs": {
      "oauth": {
        "weixin": {
          "appid": "你的开放平台appid",
          "appsecret": ""
        }
      }
    }
  }
}
```

2. 制作自定义基座并重新运行

## ⚠️ 重要提醒

1. **密钥安全**：不要将真实的密钥提交到Git仓库
2. **云函数部署**：修改配置后必须重新部署云函数
3. **测试环境**：小程序测试需要在真机上进行，不能在模拟器测试微信登录

## 🐛 调试技巧

如果仍然出现500错误：
1. 在uniCloud控制台查看云函数日志
2. 检查云函数是否有最新版本
3. 确认云服务空间是否正常运行

完成以上步骤后，重新编译运行项目即可。