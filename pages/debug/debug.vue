<template>
  <view class="debug-container">
    <view class="debug-header">
      <text class="debug-title">数据库调试工具</text>
    </view>
    
    <view class="debug-buttons">
      <button @click="createTestData" class="debug-btn init-btn">0. 创建测试数据</button>
      <button @click="testBasicGet" class="debug-btn">1. 测试基础 get() 查询</button>
      <button @click="testWhereQuery" class="debug-btn">2. 测试 where() 条件查询</button>
      <button @click="testCrossTableQuery" class="debug-btn">4. 测试跨表查询</button>
      <button @click="testAllSteps" class="debug-btn primary-btn">运行所有测试步骤</button>
      
      <!-- 新增: Book ID查询测试 -->
      <view class="book-query-section">
        <text class="section-title">Book ID 查询测试</text>
        <view class="input-group">
          <input 
            v-model="bookIdInput" 
            placeholder="请输入 Book ID" 
            class="book-id-input"
          />
          <button @click="queryBookById" class="debug-btn query-btn">查询指定Book</button>
        </view>
      </view>
      
      <button @click="clearResults" class="debug-btn clear-btn">清空结果</button>
    </view>
    
    <view class="debug-results">
      <text class="results-title">调试结果：</text>
      <scroll-view scroll-y class="results-content">
        <text class="result-text">{{ debugResults }}</text>
      </scroll-view>
    </view>
    
    <!-- uniCloud-db 组件用于显示查询结果 -->
    <view class="unicloud-db-section" v-if="showDbComponent">
      <text class="results-title">uniCloud-db 查询结果：</text>
      <unicloud-db 
        ref="unicloudDb"
        v-slot:default="{ data, loading, error }"
        :collection="dbCollection"
        :where="dbwhere"
        :loadtime="'manual'"
      >
        <view class="db-result-container">
          <view v-if="loading" class="loading">查询中...</view>
          <view v-else-if="error" class="error">
            <text>查询错误: {{ error.message }}</text>
          </view>
          <view v-else-if="data && data.length > 0" class="data-success">
            <view v-for="(item, index) in data" :key="index" class="db-item">
              <text class="item-title">{{ item.title || '无标题' }}</text>
              <text class="item-id">ID: {{ item._id }}</text>
              <text class="item-creator">创建者: {{ item.creator_id }}</text>
              <text class="item-time">创建时间: {{ formatTime(item.created_at) }}</text>
              <view class="item-details">
                <text>描述: {{ item.description || '无描述' }}</text>
                <text>颜色: {{ item.color }}</text>
                <text>共享: {{ item.is_shared ? '是' : '否' }}</text>
                <text>成员数: {{ item.member_count || 1 }}</text>
              </view>
            </view>
          </view>
          <view v-else class="no-data">
            <text>未找到匹配的记录</text>
          </view>
        </view>
      </unicloud-db>
    </view>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  data() {
    return {
      debugResults: '点击上方按钮开始调试...',
      bookIdInput: '',
      showDbComponent: false,
      dbwhere: 'title == "${this.bookIdInput}"',
      dbCollection: 'book',
      dbField: 'title,description,creator_id,created_at,updated_at,color,icon,is_shared,member_count,item_count'
    }
  },
  methods: {
    // 日志辅助函数
    log(message, data = null) {
      this.debugResults += `${message}\n`
      if (data !== null) {
        this.debugResults += `数据: ${JSON.stringify(data, null, 2)}\n`
      }
      this.debugResults += '\n'
    },
    
    // 创建测试数据
    async createTestData() {
      this.debugResults = '=== 创建测试数据 ===\n\n'
      
      try {
        const db = uniCloud.database()
        
        // 获取当前用户信息
        const currentUserId = uniCloud.getCurrentUserInfo() ? uniCloud.getCurrentUserInfo().uid : null
        
    	if (uniCloud.getCurrentUserInfo().tokenExpired < Date.now() ){
					return console.log('未登录用户');
				}
        
        this.log('当前用户ID:', currentUserId)
        
        // 检查是否已有测试数据
        const existingBooks = await db.collection('todobooks').get()
        const existingBooksData = existingBooks.data || existingBooks.result || []
        
        if (existingBooksData.length > 0) {
          this.log(`已存在 ${existingBooksData.length} 个项目册，跳过创建测试数据`)
          return
        }
        
        this.log('开始创建测试数据...')
        
        // 创建测试项目册
        const testBooks = [
          {
            title: '个人任务管理',
            description: '我的个人任务和目标管理',
            color: '#007AFF',
            icon: 'person',
            is_shared: false,
            share_type: 'private'
          }
        ]
        
        const createdBooks = []
        
        for (let i = 0; i < testBooks.length; i++) {
          const book = testBooks[i]
          this.log(`创建项目册: ${book.title}`)
          
          const result = await db.collection('todobooks').add(book)
          this.log(`✅ 项目册创建成功，ID: ${ result.result.id}`)
          
          createdBooks.push({
            _id: result.result.id,
            ...book
          })
        }
        
        // // 为共享项目册创建成员记录
        // const sharedBook = createdBooks.find(book => book.is_shared)
        // if (sharedBook) {
        //   this.log(`\n为共享项目册创建成员记录: ${sharedBook.title}`)
          
        //   const memberResult = await db.collection('todobook_members').add({
        //     todobook_id: sharedBook._id,
        //     role: 'owner',
        //     permissions: ['read', 'write', 'delete', 'manage_members', 'manage_settings']
        //   })
          
        //   this.log(`✅ 成员记录创建成功，ID: ${memberResult.id}`)
        // }
        
        // 创建一些任务项
        if (createdBooks.length > 0) {
          this.log('\n创建测试任务项...')
          
          const testTodos = [
            {
              todobook_id: createdBooks[0]._id,
              title: '完成项目文档',
              description: '编写项目的详细文档',
              priority: 'high',
              status: 'todo'
            },
            {
              todobook_id: createdBooks[0]._id,
              title: '代码审查',
              description: '审查团队成员提交的代码',
              priority: 'medium',
              status: 'in_progress'
            },
            {
              todobook_id: createdBooks[0]._id,
              title: '团队会议准备',
              description: '准备下周的团队会议材料',
              priority: 'high',
              status: 'todo'
            }
          ]
          
          for (let todo of testTodos) {
            const result = await db.collection('todoitems').add(todo)
            this.log(`✅ 任务项创建成功: ${todo.title} (ID: ${result.result.id})`)
          }
        }
        
        this.log('\n🎉 测试数据创建完成！')
        this.log('数据统计:')
        this.log(`- 项目册: ${createdBooks.length} 个`)
        this.log(`- 成员记录: 1 个`)
        this.log(`- 任务项: 3 个`)
        
      } catch (error) {
        this.log('❌ 创建测试数据失败')
        this.log('错误信息:', error.message)
        this.log('错误代码:', error.code)
        this.log('完整错误对象:', error)
      }
    },
    
    // 测试步骤1: 基础 get() 查询
    async testBasicGet() {
      this.debugResults = '=== 步骤1: 测试基础 get() 查询 ===\n\n'
      
      try {
        // 1.1 获取数据库实例
        this.log('1.1 获取数据库实例...')
        const db = uniCloud.database()
        this.log('✅ 数据库实例创建成功', { db: !!db })
        
        this.log('1.3 执行 db.collection("todobooks").get() ...')
        const db_result = await db.collection('todobooks').get()
        const result = db_result.result
        
        this.log('1.4 分析返回结果结构:')
       // this.log('- result :',  JSON.stringify(result, null, 2))

        // 1.5 提取数据数组
        const dataArray = result.data || result.result || []
        this.log(`1.5 提取数据数组: 找到 ${dataArray.length} 条记录`)
        
        // 1.6 显示前2条记录
        if (dataArray.length > 0) {
          this.log('1.6 前2条记录详情:')
          dataArray.slice(0, 2).forEach((item, index) => {
            this.log(`记录 ${index + 1}:`, item)
          })
        } else {
          this.log('1.6 没有找到任何记录')
        }
        
        
      } catch (error) {
        this.log('❌ 基础 get() 查询失败')
        this.log('错误信息:', error.message)
        this.log('错误代码:', error.code)
        this.log('完整错误对象:', error)
      }
    },
    
    // 测试步骤2: where 条件查询
    async testWhereQuery() {
      this.debugResults = '=== 步骤2: 测试 where() 条件查询 ===\n\n'
      
      const currentUserId = uniCloud.getCurrentUserInfo() ? uniCloud.getCurrentUserInfo().uid : null

      try {
        const db = uniCloud.database()
      	if (uniCloud.getCurrentUserInfo().tokenExpired < Date.now() ){
					return console.log('未登录用户');
				}
        
        
        // 2.2 查询当前用户创建的 todobooks
        this.log('2.2 查询当前用户创建的 todobooks...')
        this.log('执行: db.collection("todobooks").where({ creator_id: currentUserId }).get()')
        
        const db_myBooksResult = await db.collection('todobooks')
          .where({
            creator_id: currentUserId
          })
          .get()
        const myBooksResult = db_myBooksResult.result
        
        const myBooks = myBooksResult.data || myBooksResult.result || []
        this.log(`✅ 查询成功，找到 ${myBooks.length} 个我创建的项目册`)
        
        if (myBooks.length > 0) {
          this.log('我的项目册列表:')
          myBooks.slice(0, 2).forEach((book, index) => {
            this.log(`${index + 1}. ${book.title} (ID: ${book._id})`)
          })
        }
        
        // 2.5 使用逻辑运算符
        this.log('\n2.5 测试逻辑运算符...')
        this.log('查询: 我创建的或我参与的 todobooks')
        
        // 先获取我参与的项目册ID列表
        const db_memberResult = await db.collection('todobook_members')
          .where({
            user_id: currentUserId
          })
          .get()
        
        const memberResult = db_memberResult.result
        const memberData = memberResult.data || memberResult.result || []
        const participatedIds = memberData.map(m => m.todobook_id)
        
        this.log(`我作为成员参与的项目册ID: ${participatedIds.join(', ')}`)
      
        
      } catch (error) {
        this.log('❌ where 查询测试失败')
        this.log('错误信息:', error.message)
        this.log('错误代码:', error.code)
        this.log('完整错误对象:', error)
      }
    },
    
    
    // 测试步骤4: 跨表查询
    async testCrossTableQuery() {
      this.debugResults = '=== 步骤4: 测试跨表查询 ===\n\n'
      
      try {
        // 4.1 获取数据库实例
        this.log('4.1 获取数据库实例...')
        const db = uniCloud.database()
        this.log('✅ 数据库实例创建成功')
        
        // 4.2 获取当前用户ID
        const currentUserId = uniCloud.getCurrentUserInfo() ? uniCloud.getCurrentUserInfo().uid : null
        
        if (uniCloud.getCurrentUserInfo().tokenExpired < Date.now()) {
          this.log('❌ 用户未登录或token已过期')
          return
        }
        
        this.log('4.2 当前用户ID:', currentUserId)
        
        // 4.3 查询当前用户的第一个 todobook
        this.log('4.3 查询当前用户的第一个 todobook...')
        const db_booksResult = await db.collection('todobooks')
          .where({
            creator_id: currentUserId
          })
          .limit(1)
          .get()
        
        const booksResult = db_booksResult.result
        const books = booksResult.data || booksResult.result || []
        
        if (books.length === 0) {
          this.log('❌ 未找到任何项目册，请先创建测试数据')
          return
        }
        
        const targetBook = books[0]
        this.log(`✅ 找到目标项目册: "${targetBook.title}" (ID: ${targetBook._id})`)
        
        // 4.4 查询该项目册的成员
        this.log('4.4 查询该项目册的成员...')
        this.log(`执行: db.collection("todobook_members").where({ todobook_id: "${targetBook._id}" }).get()`)
        
        const db_membersResult = await db.collection('todobook_members')
          .where({
            todobook_id: targetBook._id
          })
          .get()
        
        const membersResult = db_membersResult.result
        const members = membersResult.data || membersResult.result || []
        
        this.log(`✅ 查询成员成功，找到 ${members.length} 个参与人`)
        
        // 4.5 显示参与人详情
        if (members.length > 0) {
          this.log('4.5 参与人详情:')
          members.forEach((member, index) => {
            this.log(`参与人 ${index + 1}:`, {
              user_id: member.user_id,
              role: member.role,
              permissions: member.permissions,
              joined_at: member.joined_at,
              is_active: member.is_active
            })
          })
        } else {
          this.log('4.5 该项目册暂无成员记录')
          this.log('提示: 可能需要先为项目册添加成员记录')
        }
        
        // 4.6 统计信息
        this.log('4.6 统计信息:')
        this.log(`- 项目册名称: ${targetBook.title}`)
        this.log(`- 项目册ID: ${targetBook._id}`)
        this.log(`- 创建者: ${targetBook.creator_id}`)
        this.log(`- 参与人总数: ${members.length}`)
        
        if (members.length > 0) {
          const roleCount = {}
          members.forEach(member => {
            roleCount[member.role] = (roleCount[member.role] || 0) + 1
          })
          
          this.log('- 角色分布:')
          Object.entries(roleCount).forEach(([role, count]) => {
            this.log(`  ${role}: ${count} 人`)
          })
          
          const activeCount = members.filter(m => m.is_active).length
          this.log(`- 活跃成员数: ${activeCount}`)
        }
        
        // 4.7 验证权限逻辑
        this.log('4.7 验证成员权限逻辑...')
        const ownerMembers = members.filter(m => m.role === 'owner')
        const adminMembers = members.filter(m => m.role === 'admin')
        const regularMembers = members.filter(m => m.role === 'member')
        
        this.log(`- 所有者 (owner): ${ownerMembers.length} 人`)
        this.log(`- 管理员 (admin): ${adminMembers.length} 人`)
        this.log(`- 普通成员 (member): ${regularMembers.length} 人`)
        
        // 4.8 测试权限验证
        this.log('4.8 测试当前用户在此项目册的权限...')
        const myMembership = members.find(m => m.user_id === currentUserId)
        
        if (myMembership) {
          this.log(`✅ 当前用户是此项目册的成员`)
          this.log(`- 角色: ${myMembership.role}`)
          this.log(`- 权限: ${myMembership.permissions ? myMembership.permissions.join(', ') : '无'}`)
        } else if (targetBook.creator_id === currentUserId) {
          this.log(`✅ 当前用户是此项目册的创建者，但无成员记录`)
          this.log(`提示: 建议为创建者添加对应的成员记录`)
        } else {
          this.log(`❌ 当前用户不是此项目册的成员`)
        }
        
      } catch (error) {
        this.log('❌ 跨表查询测试失败')
        this.log('错误信息:', error.message)
        this.log('错误代码:', error.code)
        this.log('完整错误对象:', error)
      }
    },
    
    // 运行所有测试
    async testAllSteps() {
      this.debugResults = '=== 开始运行所有测试步骤 ===\n\n'
      
      // 先创建测试数据
      await this.createTestData()
      this.debugResults += '\n' + '='.repeat(50) + '\n\n'
      
      await this.testBasicGet()
      this.debugResults += '\n' + '='.repeat(50) + '\n\n'
      
      await this.testWhereQuery()
      this.debugResults += '\n' + '='.repeat(50) + '\n\n'
      
      await this.testComplexQuery()
      this.debugResults += '\n' + '='.repeat(50) + '\n\n'
      
      await this.testCrossTableQuery()
      
      this.debugResults += '\n=== 所有测试完成 ===\n'
    },
    
    clearResults() {
      this.debugResults = '点击上方按钮开始调试...'
    },
    
    // 新增: 根据 Book ID 查询
    async queryBookById() {
      if (!this.bookIdInput.trim()) {
        this.debugResults = '=== Book ID 查询 ===\n\n❌ 请输入有效的 Book ID\n'
        return
      }
      
      this.debugResults = `=== Book ID 查询: ${this.bookIdInput} ===\n\n`
      
      try {
        // 检查用户登录状态
        if (uniCloud.getCurrentUserInfo().tokenExpired < Date.now()) {
          this.log('❌ 用户未登录或token已过期')
          return
        }
        this.dbwhere= `title == "${this.bookIdInput}"`
        
        this.showDbComponent = true
        // 手动触发查询
        this.$nextTick(() => {
          if (this.$refs.unicloudDb) {
            this.$refs.unicloudDb.loadData()
          }
        })

      } catch (error) {
        this.log('❌ 查询失败')
        this.log('错误信息:', error.message)
        this.log('错误代码:', error.code)
        this.log('完整错误对象:', error)
        this.showDbComponent = false
      }
    },
    
    // 时间格式化辅助函数
    formatTime(timestamp) {
      if (!timestamp) return '无'
      const date = new Date(timestamp)
      return date.toLocaleString()
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

.init-btn {
  background-color: #5856D6;
}

.init-btn:hover {
  background-color: #4A4ACF;
}

.primary-btn {
  background-color: #4CAF50;
}

.primary-btn:hover {
  background-color: #45a049;
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
  height: 500px;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.result-text {
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 新增样式 */
.book-query-section {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.book-id-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.query-btn {
  background-color: #FF9500;
  min-width: 120px;
}

.query-btn:hover {
  background-color: #E6850E;
}

.unicloud-db-section {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.db-result-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  background-color: #f9f9f9;
  min-height: 100px;
}

.loading {
  text-align: center;
  color: #666;
  font-size: 14px;
  padding: 20px;
}

.error {
  color: #ff3b30;
  font-size: 14px;
  padding: 10px;
}

.no-data {
  text-align: center;
  color: #666;
  font-size: 14px;
  padding: 20px;
}

.data-success {
  color: #4caf50;
}

.db-item {
  border-bottom: 1px solid #eee;
  padding: 15px 0;
  background-color: white;
  margin-bottom: 10px;
  border-radius: 4px;
  padding: 15px;
}

.db-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.item-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.item-id {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.item-creator {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.item-time {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 8px;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-details text {
  font-size: 12px;
  color: #888;
}
</style>