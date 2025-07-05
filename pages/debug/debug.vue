<template>
  <view class="debug-container">
    <view class="debug-header">
      <text class="debug-title">数据库调试工具</text>
    </view>
    
    <view class="debug-buttons">
      <button @click="checkTodobooks" class="debug-btn">检查 todobooks 表</button>
      <button @click="checkTodobookMembers" class="debug-btn">检查 todobook_members 表</button>
      <button @click="checkTodoitems" class="debug-btn">检查 todoitems 表</button>
      <button @click="checkDataIntegrity" class="debug-btn">检查数据完整性</button>
      <button @click="testPermissions" class="debug-btn">测试权限表达式</button>
      <button @click="clearResults" class="debug-btn clear-btn">清空结果</button>
    </view>
    
    <view class="debug-results">
      <text class="results-title">调试结果：</text>
      <scroll-view scroll-y class="results-content">
        <text class="result-text">{{ debugResults }}</text>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      debugResults: '点击上方按钮开始调试...'
    }
  },
  methods: {
    async checkTodobooks() {
      this.debugResults = '正在检查 todobooks 表...\n'
      
      try {
        const db = uniCloud.database()
        const result = await db.collection('todobooks').get()
        
        let output = `=== todobooks 表检查结果 ===\n`
        output += `完整返回结果:\n${JSON.stringify(result, null, 2)}\n\n`
        
        const dataArray = result.data || result.result || []
        output += `记录总数: ${dataArray.length}\n\n`
        
        if (dataArray.length > 0) {
          output += `前3条记录:\n`
          dataArray.slice(0, 3).forEach((item, index) => {
            output += `${index + 1}. ${JSON.stringify(item, null, 2)}\n\n`
          })
        } else {
          output += `没有找到任何记录\n`
        }
        
        this.debugResults = output
      } catch (error) {
        this.debugResults = `❌ 检查 todobooks 表失败:\n错误: ${error.message}\n错误代码: ${error.code || 'N/A'}\n完整错误信息: ${JSON.stringify(error, null, 2)}\n`
      }
    },
    
    async checkTodobookMembers() {
      this.debugResults = '正在检查 todobook_members 表...\n'
      
      try {
        const db = uniCloud.database()
        const result = await db.collection('todobook_members').get()
        
        let output = `=== todobook_members 表检查结果 ===\n`
        output += `完整返回结果:\n${JSON.stringify(result, null, 2)}\n\n`
        
        const dataArray = result.data || result.result || []
        output += `记录总数: ${dataArray.length}\n\n`
        
        if (dataArray.length > 0) {
          output += `前3条记录:\n`
          dataArray.slice(0, 3).forEach((item, index) => {
            output += `${index + 1}. ${JSON.stringify(item, null, 2)}\n\n`
          })
        } else {
          output += `没有找到任何记录\n`
        }
        
        this.debugResults = output
      } catch (error) {
        this.debugResults = `❌ 检查 todobook_members 表失败:\n错误: ${error.message}\n错误代码: ${error.code || 'N/A'}\n完整错误信息: ${JSON.stringify(error, null, 2)}\n`
      }
    },
    
    async checkTodoitems() {
      this.debugResults = '正在检查 todoitems 表...\n'
      
      try {
        const db = uniCloud.database()
        const result = await db.collection('todoitems').get()
        
        let output = `=== todoitems 表检查结果 ===\n`
        output += `完整返回结果:\n${JSON.stringify(result, null, 2)}\n\n`
        
        const dataArray = result.data || result.result || []
        output += `记录总数: ${dataArray.length}\n\n`
        
        if (dataArray.length > 0) {
          output += `前3条记录:\n`
          dataArray.slice(0, 3).forEach((item, index) => {
            output += `${index + 1}. ${JSON.stringify(item, null, 2)}\n\n`
          })
        } else {
          output += `没有找到任何记录\n`
        }
        
        this.debugResults = output
      } catch (error) {
        this.debugResults = `❌ 检查 todoitems 表失败:\n错误: ${error.message}\n错误代码: ${error.code || 'N/A'}\n完整错误信息: ${JSON.stringify(error, null, 2)}\n`
      }
    },
    
    async checkDataIntegrity() {
      this.debugResults = '正在检查数据完整性...\n'
      
      try {
        const db = uniCloud.database()
        
        // 获取所有 todobooks
        const todoBooksResult = await db.collection('todobooks').get()
        const todoBooksData = todoBooksResult.data || todoBooksResult.result || []
        const todoBookIds = new Set(todoBooksData.map(item => item._id))
        
        // 获取所有 todobook_members
        const membersResult = await db.collection('todobook_members').get()
        const membersData = membersResult.data || membersResult.result || []
        
        let output = `=== 数据完整性检查结果 ===\n`
        output += `todobooks 查询结果:\n${JSON.stringify(todoBooksResult, null, 2)}\n\n`
        output += `todobook_members 查询结果:\n${JSON.stringify(membersResult, null, 2)}\n\n`
        output += `todobooks 记录数: ${todoBooksData.length}\n`
        output += `todobook_members 记录数: ${membersData.length}\n\n`
        
        // 检查孤立的 members 记录
        const orphanedMembers = membersData.filter(member => 
          !todoBookIds.has(member.todobook_id)
        )
        
        if (orphanedMembers.length > 0) {
          output += `❌ 发现 ${orphanedMembers.length} 条孤立的 todobook_members 记录:\n`
          orphanedMembers.forEach((member, index) => {
            output += `${index + 1}. ${JSON.stringify(member, null, 2)}\n\n`
          })
        } else {
          output += `✅ 所有 todobook_members 记录都有对应的 todobook\n`
        }
        
        // 检查每个 todobook 的成员情况
        if (todoBooksData.length > 0) {
          output += `\n=== 每个项目册的成员情况 ===\n`
          for (const todobook of todoBooksData.slice(0, 5)) {
            const memberCount = membersData.filter(m => m.todobook_id === todobook._id).length
            output += `项目册 "${todobook.title}" (ID: ${todobook._id}): ${memberCount} 个成员\n`
          }
        }
        
        this.debugResults = output
      } catch (error) {
        this.debugResults = `❌ 检查数据完整性失败:\n错误: ${error.message}\n错误代码: ${error.code || 'N/A'}\n完整错误信息: ${JSON.stringify(error, null, 2)}\n`
      }
    },
    
    async testPermissions() {
      this.debugResults = '正在测试权限表达式...\n'
      
      try {
        const db = uniCloud.database()
        
        let output = `=== 权限表达式测试 ===\n`
        
        // 获取当前用户信息
        const userInfo = uni.getStorageSync('uni-id-pages-userInfo')
        const currentUserId = userInfo ? userInfo.uid : null
        
        output += `当前用户信息: ${JSON.stringify(userInfo, null, 2)}\n`
        output += `当前用户ID: ${currentUserId || '未登录'}\n\n`
        
        if (!currentUserId) {
          output += `❌ 用户未登录，无法测试权限\n`
          this.debugResults = output
          return
        }
        
        // 测试 todobooks 查询
        try {
          const todoBooksResult = await db.collection('todobooks').get()
          const todoBooksData = todoBooksResult.data || todoBooksResult.result || []
          output += `✅ todobooks 查询成功: ${todoBooksData.length} 条记录\n`
          output += `todobooks 查询结果: ${JSON.stringify(todoBooksResult, null, 2)}\n\n`
        } catch (error) {
          output += `❌ todobooks 查询失败: ${error.message}\n`
          output += `完整错误信息: ${JSON.stringify(error, null, 2)}\n\n`
        }
        
        // 测试 todobook_members 查询
        try {
          const membersResult = await db.collection('todobook_members').get()
          const membersData = membersResult.data || membersResult.result || []
          output += `✅ todobook_members 查询成功: ${membersData.length} 条记录\n`
          output += `todobook_members 查询结果: ${JSON.stringify(membersResult, null, 2)}\n\n`
        } catch (error) {
          output += `❌ todobook_members 查询失败: ${error.message}\n`
          output += `完整错误信息: ${JSON.stringify(error, null, 2)}\n\n`
        }
        
        // 测试特定 todobook_members 记录的权限
        try {
          const specificMember = await db.collection('todobook_members').limit(1).get()
          const specificMemberData = specificMember.data || specificMember.result || []
          
          if (specificMemberData.length > 0) {
            const member = specificMemberData[0]
            output += `\n=== 测试特定记录权限 ===\n`
            output += `测试记录: ${JSON.stringify(member, null, 2)}\n`
            
            // 尝试查询对应的 todobook
            try {
              const todobook = await db.collection('todobooks').doc(member.todobook_id).get()
              const todookData = todobook.data || todobook.result || []
              output += `对应 todobook 查询结果: ${JSON.stringify(todobook, null, 2)}\n`
              
              if (todookData.length > 0) {
                output += `✅ 对应的 todobook 存在\n`
                
                // 权限判断
                const isOwner = todookData[0].creator_id === currentUserId
                const isMember = member.user_id === currentUserId
                
                output += `\n权限分析:\n`
                output += `- 是否为项目册创建者: ${isOwner ? '是' : '否'}\n`
                output += `- 是否为成员本人: ${isMember ? '是' : '否'}\n`
                output += `- 应该有访问权限: ${isOwner || isMember ? '是' : '否'}\n`
              } else {
                output += `❌ 对应的 todobook 不存在\n`
              }
            } catch (error) {
              output += `❌ 查询对应 todobook 失败: ${error.message}\n`
              output += `完整错误信息: ${JSON.stringify(error, null, 2)}\n`
            }
          } else {
            output += `没有 todobook_members 记录可供测试\n`
          }
        } catch (error) {
          output += `❌ 测试特定记录权限失败: ${error.message}\n`
          output += `完整错误信息: ${JSON.stringify(error, null, 2)}\n`
        }
        
        this.debugResults = output
      } catch (error) {
        this.debugResults = `❌ 测试权限表达式失败:\n错误: ${error.message}\n错误代码: ${error.code || 'N/A'}\n完整错误信息: ${JSON.stringify(error, null, 2)}\n`
      }
    },
    
    clearResults() {
      this.debugResults = '点击上方按钮开始调试...'
    }
  }
}
</script>

<style>
.debug-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.debug-header {
  margin-bottom: 20px;
  text-align: center;
}

.debug-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.debug-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.debug-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  background-color: #007AFF;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.debug-btn:hover {
  background-color: #0056CC;
}

.clear-btn {
  background-color: #FF3B30;
}

.clear-btn:hover {
  background-color: #D70015;
}

.debug-results {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.results-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.results-content {
  height: 400px;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.result-text {
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>