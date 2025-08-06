<template>
  <view class="debug-container">
    <view class="debug-header">
      <text class="debug-title">数据库调试工具</text>
    </view>
    
    <view class="debug-buttons">
      <button @click="createTestData" class="debug-btn init-btn">0. 创建测试数据</button>
      <button @click="createTemplateBook" class="debug-btn template-btn">创建模板项目册</button>
      <button @click="triggerImportData" class="debug-btn import-btn">导入项目册数据</button>
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
    
    <!-- JSON输入区域 -->
    <view class="json-input-section" v-if="showJsonInput">
      <text class="section-title">粘贴JSON文件内容</text>
      <textarea 
        v-model="jsonInputContent" 
        placeholder="请粘贴JSON文件的完整内容到此处..."
        class="json-input-textarea"
        :maxlength="-1"
      ></textarea>
      <view class="json-input-buttons">
        <button @click="parseAndImportJson" class="debug-btn import-btn">解析并导入</button>
        <button @click="closeJsonInput" class="debug-btn clear-btn">取消</button>
      </view>
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
import { useBookData } from '@/pages/todobooks/composables/useBookData.js'

const db = uniCloud.database()

export default {
  data() {
    return {
      debugResults: '点击上方按钮开始调试...',
      bookIdInput: '',
      showDbComponent: false,
      dbwhere: 'title == "${this.bookIdInput}"',
      dbCollection: 'book',
      dbField: 'title,description,creator_id,created_at,updated_at,color,icon,is_shared,member_count,item_count',
      showJsonInput: false,
      jsonInputContent: ''
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
    },
    
    // 创建模板项目册
    async createTemplateBook() {
      this.debugResults = '=== 创建模板项目册 ===\n\n'
      
      try {
        // 检查用户登录状态
        if (uniCloud.getCurrentUserInfo().tokenExpired < Date.now()) {
          this.log('❌ 用户未登录或token已过期')
          return
        }
        
        this.log('开始创建模板项目册...')
        
        // 使用 useBookData 创建项目册
        const { createTodoBook } = useBookData()
        
        // 创建模板项目册
        const templateBookData = {
          title: 'template',
          description: '装修项目管理模板',
          color: '#FF6B35',
          icon: 'home',
          is_shared: false,
          share_type: 'private'
        }
        
        this.log('创建项目册: template')
        const createdBook = await createTodoBook(templateBookData)
        
        this.log(`✅ 项目册创建成功，ID: ${createdBook._id}`)
        
        // 读取模板任务文件并创建任务
        this.log('\n开始读取模板任务文件...')
        
        // 读取模板任务数据
        const templateTasks = await this.readTemplateTaskFile()
        
        if (templateTasks.length === 0) {
          this.log('❌ 模板任务文件为空或格式错误')
          return
        }
        
        this.log(`找到 ${templateTasks.length} 个模板任务`)
        
        // 为标签分配颜色
        const tagColorMap = this.generateTagColorMap(templateTasks)
        this.log(`\n🎨 标签颜色分配:`)
        Object.entries(tagColorMap).forEach(([tag, color]) => {
          this.log(`- ${tag}: ${color}`)
        })
        
        // 批量创建任务
        this.log('\n开始创建任务...')
        const todoItemCo = uniCloud.importObject('todobook-co')
        
        let successCount = 0
        let failCount = 0
        
        for (let i = 0; i < templateTasks.length; i++) {
          const task = templateTasks[i]
          
          try {
            // 构建标签数组，包含名称和颜色
            const taskTags = task.tags ? [{
              name: task.tags,
              color: tagColorMap[task.tags] || '#007AFF'
            }] : []
            
            const taskData = {
              todobook_id: createdBook._id,
              title: task.title,
              description: task.description,
              tags: taskTags,
              priority: 'medium',
              status: 'todo',
              level: 0
            }
            
            // 通过云函数创建任务
            const result = await todoItemCo.createTodoItem(taskData)
            
            if (result.code === 0) {
              successCount++
              this.log(`✅ 任务创建成功: ${task.title} [${task.tags}]`)
            } else {
              failCount++
              this.log(`❌ 任务创建失败: ${task.title} - ${result.message}`)
            }
          } catch (error) {
            failCount++
            this.log(`❌ 任务创建失败: ${task.title} - ${error.message}`)
          }
        }
        
        this.log(`\n🎉 模板项目册创建完成！`)
        this.log(`📊 统计信息:`)
        this.log(`- 项目册: 1 个`)
        this.log(`- 任务总数: ${templateTasks.length} 个`)
        this.log(`- 成功创建: ${successCount} 个`)
        this.log(`- 创建失败: ${failCount} 个`)
        this.log(`- 标签类型: ${Object.keys(tagColorMap).length} 个`)
        
        if (failCount > 0) {
          this.log(`\n⚠️  有 ${failCount} 个任务创建失败，请检查日志`)
        }
        
      } catch (error) {
        this.log('❌ 创建模板项目册失败')
        this.log('错误信息:', error.message)
        this.log('错误代码:', error.code)
        this.log('完整错误对象:', error)
      }
    },
    
    // 为标签生成颜色映射
    generateTagColorMap(tasks) {
      const tagColorMap = {}
      
      // 预定义颜色池，确保视觉上容易区分
      const colorPool = [
        '#FF6B35', // 橙色
        '#007AFF', // 蓝色
        '#34C759', // 绿色
        '#FF3B30', // 红色
        '#5856D6', // 紫色
        '#FF9500', // 黄色
        '#8E8E93', // 灰色
        '#AF52DE', // 品红色
        '#FF2D92', // 粉色
        '#5AC8FA', // 青色
        '#FFCC00', // 金色
        '#30D158', // 薄荷绿
        '#007AFF', // 天蓝色
        '#BF5AF2', // 淡紫色
        '#FF6B6B', // 珊瑚色
        '#4ECDC4', // 绿松石色
        '#45B7D1', // 天空蓝
        '#96CEB4', // 淡绿色
        '#FFEAA7', // 淡黄色
        '#DDA0DD'  // 梅色
      ]
      
      // 收集所有唯一标签
      const uniqueTags = new Set()
      tasks.forEach(task => {
        if (task.tags && task.tags.trim()) {
          uniqueTags.add(task.tags.trim())
        }
      })
      
      // 为每个标签分配颜色
      let colorIndex = 0
      uniqueTags.forEach(tag => {
        tagColorMap[tag] = colorPool[colorIndex % colorPool.length]
        colorIndex++
      })
      
      return tagColorMap
    },
    
    // 触发文件选择
    triggerImportData() {
      // 提示用户手动复制文件内容
      this.debugResults = '=== 导入项目册数据 ===\n\n'
      this.log('请将JSON文件内容复制到下方输入框中，然后点击"解析并导入"按钮')
      this.log('或者使用开发者工具在控制台执行: this.importFromJsonString(jsonString)')
      
      // 显示输入框让用户粘贴JSON内容
      this.showJsonInput = true
    },
    
    // 解析并导入JSON内容
    parseAndImportJson() {
      if (!this.jsonInputContent.trim()) {
        this.log('❌ 请先粘贴JSON内容')
        return
      }
      
      this.showJsonInput = false
      this.importFromJsonString(this.jsonInputContent)
    },
    
    // 关闭JSON输入框
    closeJsonInput() {
      this.showJsonInput = false
      this.jsonInputContent = ''
    },
    
    // 从JSON字符串导入数据
    async importFromJsonString(jsonString) {
      this.debugResults = '=== 导入项目册数据 ===\n\n'
      
      try {
        // 检查用户登录状态
        if (uniCloud.getCurrentUserInfo().tokenExpired < Date.now()) {
          this.log('❌ 用户未登录或token已过期')
          return
        }
        
        const currentUserId = uniCloud.getCurrentUserInfo().uid
        this.log('当前用户ID:', currentUserId)
        
        // 解析 JSON 数据
        this.log('正在解析 JSON 数据...')
        let importData
        try {
          importData = JSON.parse(jsonString)
        } catch (parseError) {
          this.log('❌ JSON 格式错误:', parseError.message)
          return
        }
        
        // 验证数据格式
        if (!importData.todobook || !importData.tasks) {
          this.log('❌ 数据格式无效，缺少必要字段 todobook 或 tasks')
          return
        }
        
        // 验证 todobook 必需字段
        if (!importData.todobook.title) {
          this.log('❌ 项目册缺少标题字段')
          return
        }
        
        // 验证 tasks 是否为数组
        if (!Array.isArray(importData.tasks)) {
          this.log('❌ tasks 字段必须是数组')
          return
        }
        
        this.log('✅ 数据结构验证通过')
        
        this.log(`✅ 数据解析成功`)
        this.log(`- 项目册标题: ${importData.todobook.title}`)
        this.log(`- 任务数量: ${importData.tasks.length}`)
        
        // 开始导入流程
        await this.performDataImport(importData, currentUserId)
        
      } catch (error) {
        this.log('❌ 导入失败')
        this.log('错误信息:', error.message)
        this.log('完整错误对象:', error)
      }
    },
    
    // 处理文件选择
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) {
        return
      }
      
      // 检查文件名或路径是否包含.json
      const fileName = file.name || file.path || ''
      if (!fileName.toLowerCase().includes('.json')) {
        this.log('❌ 请选择 JSON 文件')
        return
      }
      
      this.importDataFromFile(file)
    },
    
    // 从文件导入数据
    async importDataFromFile(file) {
      this.debugResults = '=== 导入项目册数据 ===\n\n'
      
      try {
        // 检查用户登录状态
        if (uniCloud.getCurrentUserInfo().tokenExpired < Date.now()) {
          this.log('❌ 用户未登录或token已过期')
          return
        }
        
        const currentUserId = uniCloud.getCurrentUserInfo().uid
        this.log('当前用户ID:', currentUserId)
        
        // 读取文件内容
        this.log('正在读取文件...')
        const fileContent = await this.readFileAsText(file)
        
        // 解析 JSON 数据
        this.log('正在解析 JSON 数据...')
        let importData
        try {
          importData = JSON.parse(fileContent)
        } catch (parseError) {
          this.log('❌ JSON 格式错误:', parseError.message)
          return
        }
        
        // 验证数据格式
        if (!importData.todobook || !importData.tasks) {
          this.log('❌ 数据格式无效，缺少必要字段 todobook 或 tasks')
          return
        }
        
        // 验证 todobook 必需字段
        if (!importData.todobook.title) {
          this.log('❌ 项目册缺少标题字段')
          return
        }
        
        // 验证 tasks 是否为数组
        if (!Array.isArray(importData.tasks)) {
          this.log('❌ tasks 字段必须是数组')
          return
        }
        
        this.log('✅ 数据结构验证通过')
        
        this.log(`✅ 数据解析成功`)
        this.log(`- 项目册标题: ${importData.todobook.title}`)
        this.log(`- 任务数量: ${importData.tasks.length}`)
        
        // 开始导入流程
        await this.performDataImport(importData, currentUserId)
        
      } catch (error) {
        this.log('❌ 导入失败')
        this.log('错误信息:', error.message)
        this.log('完整错误对象:', error)
      }
    },
    
    // 执行数据导入
    async performDataImport(importData, currentUserId) {
      try {
        const { createTodoBook } = useBookData()
        const todoItemCo = uniCloud.importObject('todobook-co')
        
        // 第一步：创建项目册
        this.log('\n=== 步骤1: 创建项目册 ===')
        
        const todohookData = {
          title: importData.todobook.title,
          description: importData.todobook.description || '',
          color: importData.todobook.color || '#007AFF',
          icon: importData.todobook.icon || 'folder',
          is_shared: false,
          share_type: 'private'
        }
        
        this.log(`创建项目册: ${todohookData.title}`)
      
      let createdBook, newBookId
      try {
        createdBook = await createTodoBook(todohookData)
        newBookId = createdBook._id
        this.log(`✅ 项目册创建成功，新ID: ${newBookId}`)
      } catch (bookError) {
        this.log('❌ 项目册创建失败，终止导入')
        this.log('错误详情:', bookError.message)
        return
      }
      
      // 第二步：创建任务并建立ID映射
      this.log('\n=== 步骤2: 创建任务 ===')
      
      const taskIdMapping = new Map() // 旧ID -> 新ID 映射
      const commentIdMapping = new Map() // 旧评论ID -> 新评论ID 映射
      
      let successCount = 0
      let failCount = 0
      
      // 先创建所有任务（不包含评论）
      for (const task of importData.tasks) {
        try {
          const taskData = {
            todobook_id: newBookId,
            title: task.title,
            description: task.description || '',
            tags: task.tags || [],
            priority: task.priority || 'medium',
            status: task.status || 'todo',
            level: task.level || 0,
            budget: task.budget || null,
            due_date: task.due_date || null,
            progress: task.progress || 0,
            actual_cost: task.actual_cost || 0,
            estimated_hours: task.estimated_hours || 0,
            // 确保创建者和分配者都是当前用户
            creator_id: currentUserId,
            assignee_id: currentUserId
          }
          
          // 创建任务
          const result = await todoItemCo.createTodoItem(taskData)
          
          if (result.code === 0) {
            const newTaskId = result.data._id
            taskIdMapping.set(task._id, newTaskId)
            successCount++
            this.log(`✅ 任务创建成功: ${task.title} (${task._id} → ${newTaskId})`)
          } else {
            failCount++
            this.log(`❌ 任务创建失败: ${task.title} - ${result.message}`)
          }
          
        } catch (error) {
          failCount++
          this.log(`❌ 任务创建失败: ${task.title} - ${error.message}`)
        }
      }
      
      // 第三步：处理评论
      this.log('\n=== 步骤3: 创建评论 ===')
      
      let commentSuccessCount = 0
      let commentFailCount = 0
      
      for (const task of importData.tasks) {
        if (!task.comments || task.comments.length === 0) {
          continue
        }
        
        const newTaskId = taskIdMapping.get(task._id)
        if (!newTaskId) {
          this.log(`❌ 跳过任务 ${task.title} 的评论，任务创建失败`)
          continue
        }
        
        // 按时间顺序排序评论，确保回复关系正确
        const sortedComments = task.comments
          .filter(comment => !comment.is_deleted)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        
        for (const comment of sortedComments) {
          try {
            // 处理回复关系
            let replyToCommentId = null
            if (comment.reply_to) {
              const originalReplyToId = comment.reply_to
              replyToCommentId = commentIdMapping.get(originalReplyToId) || null
            }
            
            const commentData = {
              todoitem_id: newTaskId,
              content: comment.content,
              reply_to: replyToCommentId,
              user_id: currentUserId
            }
            
            // 创建评论
            const result = await todoItemCo.addTaskComment(
              newTaskId, 
              comment.content, 
              replyToCommentId
            )
            
            if (result.code === 0) {
              const newCommentId = result.data.commentId
              commentIdMapping.set(comment._id, newCommentId)
              commentSuccessCount++
              this.log(`✅ 评论创建成功: ${comment.content.substring(0, 30)}...`)
            } else {
              commentFailCount++
              this.log(`❌ 评论创建失败: ${comment.content.substring(0, 30)}... - ${result.message}`)
            }
            
          } catch (error) {
            commentFailCount++
            this.log(`❌ 评论创建失败: ${comment.content.substring(0, 30)}... - ${error.message}`)
          }
        }
      }
      
      // 导入完成状态
      this.log('\n🎉 数据导入完成！')
      
      if (failCount > 0 || commentFailCount > 0) {
        this.log(`\n⚠️  有部分数据导入失败，请检查上方日志`)
      } else {
        this.log(`\n✅  所有数据导入成功`)
      }
      
      } catch (error) {
        this.log('\n❌ 导入过程发生严重错误')
        this.log('错误信息:', error.message)
        this.log('错误堆栈:', error.stack)
        throw error // 重新抛出错误，让上层处理
      }
    },
    
    // 读取文件内容为文本
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        // 如果是uni-app的临时文件，使用uni.getFileSystemManager读取
        if (file.path) {
          const fs = uni.getFileSystemManager()
          fs.readFile({
            filePath: file.path,
            encoding: 'utf8',
            success: (res) => {
              resolve(res.data)
            },
            fail: (err) => {
              reject(new Error('文件读取失败: ' + err.errMsg))
            }
          })
        } else {
          // 传统的FileReader方式
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.onerror = () => reject(new Error('文件读取失败'))
          reader.readAsText(file, 'UTF-8')
        }
      })
    },
    
    // 读取模板任务文件
    async readTemplateTaskFile() {
      try {
        // 模拟读取文件内容（实际项目中应该通过云函数读取）
        const templateContent = `确认预算,装修前准备,1、总预算控制在40万以内；2、项目实施前准备10万现金，后续视逐步推进及时补充现金（优先从月工资补充，其次从投资款进行套现）
梳理需求,装修前准备,确定整体风格，基础功能区分布等
物业备案,装修前准备,1、到物业办理装修的相关手续（装修押金）2、垃圾清理，需要承包给物业，拆墙前完成【实际情况：物业不做承包了，自己找了垃圾承包商，价格也谈好，后面家里人觉得可以分批运，按车为单位，300/车，目前按这个方式，进行中】
装修图纸,装修前准备,整体布局图，平面图
橱柜设计,装修前准备,所有橱柜的详细设计尺寸图，含水电布局
买中央空调,泥瓦,一拖一，加两个挂机，找合适的时间下单买
拆改交底,泥瓦,确定墙怎么拆，怎么砌
拆墙,泥瓦,提前联系拆墙师傅，对墙面进行拆除。包括整墙拆除和半墙拆除（把墙削薄）
砌墙,泥瓦,拆墙后砌墙
封窗,泥瓦,注意晾衣架的设计
核对水电点位,水电,确定插座、水龙头、马桶、地漏、淋浴隔断、洗衣机、空调、洗碗机、油烟机的位置
网购地漏、止逆阀、隔音棉,水电,地漏按水电预留个数，瓷砖前采购到位，止逆阀买油烟机的时候会送
水电交底,水电,与水电工沟通，确定水电采购清单。。热水器要三个水管，实现零冷水。
打孔,水电,无
水电铺设,水电,水电师傅安装水电管线，要拍照记录水电走线，便于未来维修。
水电验收,水电,1.水管打压测试，8-10个压，30分钟不渗不漏，掉压不超过0.05MP合格；2.检查房间的门铃、保险插座、电视宽带3检查强弱电箱的开关是否牢固，能否显示不同分路4用电笔试一下各插座面板是否有电水电掩埋前，到处拍好照片或视频，方便日后维修
安装中央空调,水电,预约中央空调店家上门安装
燃气改管,水电,无
隔音棉包管道,水电,无
厨房台面材料确定,水电,确定岩板还是石英石，厚度
厨房灶台交底,水电,具体尺寸和分布图告知，店家现场来量
厨房灶台安装,水电,无
回填,泥瓦,用水泥等对开槽开孔处进行回填
找平,泥瓦,对地面整体进行找平，以便后续工作可以顺利进行。
购买瓷砖建材,泥瓦,去市场购买瓷砖了。这里包括地面砖、墙面砖、门槛石、挡水条
瓷砖铺贴设计,泥瓦,无
购买五金卫浴,泥瓦,卫生间里的花洒、马桶、洗手台、地漏、毛巾杆等，可以去订货
安装阳台窗,泥瓦,无
防水,泥瓦,厨房、卫生间、阳台，只要有需要的地方，开始做防水。
防水验收,泥瓦,防水做完后，立刻进行闭水试验，并通知物业与楼下邻居
安装挡水条,泥瓦,在贴砖前预埋挡水条，不会出现缝隙，防水效果好。贴了砖再安装要打胶，后续容易发黄
瓷砖铺贴,泥瓦,所有瓷砖开始施工
瓷砖验收,泥瓦,无
买地面保护膜,泥瓦,无
铺地面保护膜,泥瓦,无
木门（窗）定制,木工,定制室内门，包括木门和推拉门、门套、窗套，以及窗台上的石材
厨房定制,木工,厨房里的橱柜、水槽、燃气灶、油烟机订购
定制衣柜定制,木工,木工打柜子
吊顶板材购买,木工,吊顶板材计算，最好可以选出小尺寸，可以放厂家直接裁好
吊顶,木工,无
制作窗帘盒,木工,无
安装室内门,木工,无
安装木地板、踢脚线,木工,无木地板，安装踢脚线
木工验收,木工,无
墙面建材,油漆,墙面的乳胶漆（或壁纸、硅藻泥等）采购，连腻子一块买了
墙面施工,油漆,墙面开始进行施工，包括找平、批刮腻子、刷漆等
油漆验收,油漆,用手电筒照墙面，没有明显的沙眼、浮尘;0墙面没有竖纹用2m靠尺检查墙面，误差不超过3mm，顺平可以放宽标准
买灯,软装,无
买浴霸、衣架,软装,无
买开关插座,油漆,无
厨房卫生间吊顶,木工,无
安装开关插座,油漆,无
安装厨卫吊顶、浴霸,木工,无
安装灯具,软装,无
打扫保洁,软装,无
美缝,泥瓦,无
买智能马桶,软装,无
安装马桶、浴室五金,水电,无`
        
        // 解析模板任务数据
        const tasks = []
        const lines = templateContent.split('\n')
        
        for (let line of lines) {
          line = line.trim()
          if (line) {
            const parts = line.split(',')
            if (parts.length >= 3) {
              tasks.push({
                title: parts[0].trim(),
                tags: parts[1].trim(),
                description: parts[2].trim()
              })
            }
          }
        }
        
        this.log(`解析模板任务完成，共 ${tasks.length} 个任务`)
        
        return tasks
      } catch (error) {
        this.log('❌ 读取模板任务文件失败:', error.message)
        return []
      }
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

.template-btn {
  background-color: #FF6B35;
}

.template-btn:hover {
  background-color: #E55A2B;
}

.import-btn {
  background-color: #28a745;
}

.import-btn:hover {
  background-color: #218838;
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

/* JSON输入区域样式 */
.json-input-section {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.json-input-textarea {
  width: 100%;
  min-height: 200px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  font-size: 12px;
  font-family: monospace;
  margin: 10px 0;
  box-sizing: border-box;
  resize: vertical;
}

.json-input-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>