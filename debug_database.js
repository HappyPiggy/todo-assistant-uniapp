// 数据库调试脚本 - 检查数据完整性
// 使用方法：在 HBuilderX 中创建一个云函数来运行此脚本

const db = uniCloud.database()

// 1. 检查 todobooks 表数据
async function checkTodobooks() {
  console.log('=== 检查 todobooks 表 ===')
  try {
    const result = await db.collection('todobooks').get()
    console.log('todobooks 记录数量:', result.data.length)
    
    if (result.data.length > 0) {
      console.log('前3条 todobooks 记录:')
      result.data.slice(0, 3).forEach(item => {
        console.log({
          _id: item._id,
          title: item.title,
          creator_id: item.creator_id,
          created_at: item.created_at
        })
      })
    }
  } catch (error) {
    console.error('查询 todobooks 失败:', error)
  }
}

// 2. 检查 todobook_members 表数据
async function checkTodobookMembers() {
  console.log('\n=== 检查 todobook_members 表 ===')
  try {
    const result = await db.collection('todobook_members').get()
    console.log('todobook_members 记录数量:', result.data.length)
    
    if (result.data.length > 0) {
      console.log('前3条 todobook_members 记录:')
      result.data.slice(0, 3).forEach(item => {
        console.log({
          _id: item._id,
          todobook_id: item.todobook_id,
          user_id: item.user_id,
          role: item.role
        })
      })
    }
  } catch (error) {
    console.error('查询 todobook_members 失败:', error)
  }
}

// 3. 检查数据完整性 - 孤立的 todobook_members 记录
async function checkDataIntegrity() {
  console.log('\n=== 检查数据完整性 ===')
  try {
    // 获取所有 todobook_members
    const membersResult = await db.collection('todobook_members').get()
    console.log('todobook_members 总数:', membersResult.data.length)
    
    // 获取所有 todobooks
    const todoBooksResult = await db.collection('todobooks').get()
    const todoBookIds = new Set(todoBooksResult.data.map(item => item._id))
    console.log('todobooks 总数:', todoBooksResult.data.length)
    
    // 检查孤立的 members 记录
    const orphanedMembers = membersResult.data.filter(member => 
      !todoBookIds.has(member.todobook_id)
    )
    
    if (orphanedMembers.length > 0) {
      console.log('发现孤立的 todobook_members 记录:')
      orphanedMembers.forEach(member => {
        console.log({
          _id: member._id,
          todobook_id: member.todobook_id,
          user_id: member.user_id,
          message: '对应的 todobook 不存在'
        })
      })
    } else {
      console.log('✓ 所有 todobook_members 记录都有对应的 todobook')
    }
  } catch (error) {
    console.error('检查数据完整性失败:', error)
  }
}

// 4. 测试权限表达式
async function testPermissionExpression() {
  console.log('\n=== 测试权限表达式 ===')
  try {
    // 获取第一条 todobook_members 记录
    const membersResult = await db.collection('todobook_members').limit(1).get()
    
    if (membersResult.data.length > 0) {
      const member = membersResult.data[0]
      console.log('测试记录:', {
        _id: member._id,
        todobook_id: member.todobook_id,
        user_id: member.user_id
      })
      
      // 尝试查询对应的 todobook
      try {
        const todoBookResult = await db.collection('todobooks')
          .doc(member.todobook_id)
          .get()
        
        if (todoBookResult.data.length > 0) {
          console.log('✓ 对应的 todobook 存在:', {
            _id: todoBookResult.data[0]._id,
            title: todoBookResult.data[0].title,
            creator_id: todoBookResult.data[0].creator_id
          })
        } else {
          console.log('✗ 对应的 todobook 不存在')
        }
      } catch (error) {
        console.error('✗ 查询对应 todobook 失败:', error.message)
      }
    } else {
      console.log('没有 todobook_members 记录可供测试')
    }
  } catch (error) {
    console.error('测试权限表达式失败:', error)
  }
}

// 主函数
async function main() {
  await checkTodobooks()
  await checkTodobookMembers()
  await checkDataIntegrity()
  await testPermissionExpression()
  
  console.log('\n=== 调试完成 ===')
}

// 导出函数供云函数调用
module.exports = {
  main,
  checkTodobooks,
  checkTodobookMembers,
  checkDataIntegrity,
  testPermissionExpression
}