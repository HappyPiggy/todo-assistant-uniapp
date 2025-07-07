// 项目册管理云对象
const uniID = require('uni-id-common')

module.exports = {
  _before: function () {
    this.uniID = uniID.createInstance({
      context: this.getCloudInfo()
    })
  },

  /**
   * 获取用户的项目册列表
   */
  async getTodoBooks(options = {}) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    
    if (payload.code !== 0) {
      console.error('Token验证失败:', payload)
      return {
        code: payload.code || 30202,
        message: payload.message || payload.errMsg || '用户未登录或token已过期'
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()
    const { 
      include_archived = false, 
      page = 1,
      pageSize = 20,
      keyword = ''
    } = options
    
    // 参数验证
    let validPage = page
    let validPageSize = pageSize
    if (validPage < 1) validPage = 1
    if (validPageSize < 1 || validPageSize > 100) validPageSize = 20

    try {
      // 先获取用户参与的项目册ID列表
      const memberResult = await db.collection('todobook_members')
        .where({ user_id: uid, is_active: true })
        .field({ todobook_id: true })
        .get()
      
      const memberBookIds = memberResult.data.map(item => item.todobook_id)
      
      // 构建查询条件
      const whereCondition = {
        $or: [
          { creator_id: uid }
        ]
      }
      
      // 添加成员项目册
      if (memberBookIds.length > 0) {
        whereCondition.$or.push({ _id: db.command.in(memberBookIds) })
      }
      
      // 归档状态
      if (!include_archived) {
        whereCondition.is_archived = false
      }
      
      // 搜索条件 - 仅搜索项目册标题，精确包含匹配
      if (keyword && keyword.trim()) {
        const trimmedKeyword = keyword.trim()
        // 使用正则表达式进行包含匹配，忽略大小写
        const escapedKeyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        whereCondition.$and = [{
          title: {
            $regex: escapedKeyword,
            $options: 'i'
          }
        }]
      }
      
      // 调试日志：打印查询条件
      // console.log('【调试】搜索关键字:', keyword)
      // console.log('【调试】最终查询条件:', JSON.stringify(whereCondition, null, 2))
      
      // 创建查询对象
      const query = db.collection('todobooks').where(whereCondition)
      
      // 并行执行查询数据和总数
      const [dataResult, countResult] = await Promise.all([
        query
          .orderBy('sort_order', 'asc')
          .orderBy('updated_at', 'desc')
          .skip((validPage - 1) * validPageSize)
          .limit(validPageSize)
          .get(),
        query.count()
      ])
      
      // 调试日志：打印查询结果
      // console.log('【调试】查询返回的项目册数量:', dataResult.data.length)
      // console.log('【调试】查询返回的项目册标题:', dataResult.data.map(book => book.title))

      // 获取每个项目册的成员信息和任务统计
      const todoBooks = await Promise.all(
        dataResult.data.map(async (book) => {
          const [memberResult, taskStatsResult] = await Promise.all([
            // 获取成员数量
            db.collection('todobook_members')
              .where({ todobook_id: book._id, is_active: true })
              .count(),
            
            // 获取任务统计
            db.collection('todoitems')
              .aggregate()
              .match({ todobook_id: book._id })
              .group({
                _id: '$status',
                count: db.command.aggregate.sum(1)
              })
              .end()
          ])

          // 处理任务统计
          const taskStats = {
            total: 0,
            todo: 0,
            in_progress: 0,
            completed: 0
          }
          
          if (taskStatsResult.data) {
            taskStatsResult.data.forEach(stat => {
              taskStats[stat._id] = stat.count
              taskStats.total += stat.count
            })
          }

          return {
            ...book,
            member_count: memberResult.total,
            item_count: taskStats.total,
            completed_count: taskStats.completed,
            task_stats: taskStats
          }
        })
      )

      // 返回分页数据
      return {
        code: 0,
        data: {
          list: todoBooks,
          pagination: {
            page: validPage,
            pageSize: validPageSize,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / validPageSize),
            hasMore: dataResult.data.length === validPageSize
          }
        }
      }
    } catch (error) {
      console.error('获取项目册列表失败:', error)
      return {
        code: 500,
        message: '获取项目册列表失败'
      }
    }
  },

  /**
   * 创建项目册
   */
  async createTodoBook(bookData) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code !== 0) {
      return {
        code: payload.code || 30202,
        message: payload.message || payload.errMsg || '用户未登录或token已过期'
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    // 数据验证
    const { title, description = '', color = '#007AFF', icon = 'folder' } = bookData
    
    if (!title || title.trim().length === 0) {
      return {
        code: 400,
        message: '项目册标题不能为空'
      }
    }

    if (title.length > 100) {
      return {
        code: 400,
        message: '项目册标题不能超过100个字符'
      }
    }

    try {
      const now = new Date()
      const newBook = {
        title: title.trim(),
        description,
        creator_id: uid,
        created_at: now,
        updated_at: now,
        color,
        icon,
        is_shared: false,
        share_type: 'private',
        member_count: 1,
        item_count: 0,
        completed_count: 0,
        sort_order: 0,
        is_archived: false,
        last_activity_at: now
      }

      const result = await db.collection('todobooks').add(newBook)
      
      // 添加创建者为所有者
      await db.collection('todobook_members').add({
        todobook_id: result.id,
        user_id: uid,
        role: 'owner',
        permissions: ['read', 'write', 'delete', 'manage_members', 'manage_settings'],
        joined_at: now,
        last_access_at: now,
        is_active: true
      })

      return {
        code: 0,
        data: {
          _id: result.id,
          ...newBook
        }
      }
    } catch (error) {
      console.error('创建项目册失败:', error)
      return {
        code: 500,
        message: '创建项目册失败'
      }
    }
  },

  /**
   * 更新项目册
   */
  async updateTodoBook(bookId, updateData) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code !== 0) {
      return {
        code: payload.code || 30202,
        message: payload.message || payload.errMsg || '用户未登录或token已过期'
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      // 检查权限 - 内联权限检查逻辑
      let hasPermission = false
      
      // 检查是否是创建者
      const bookResult = await db.collection('todobooks')
        .where({ _id: bookId, creator_id: uid })
        .get()
      
      if (bookResult.data.length > 0) {
        hasPermission = true // 创建者有所有权限
      } else {
        // 检查成员权限
        const memberResult = await db.collection('todobook_members')
          .where({
            todobook_id: bookId,
            user_id: uid,
            is_active: true
          })
          .get()

        if (memberResult.data.length > 0) {
          const member = memberResult.data[0]
          hasPermission = member.permissions.includes('write')
        }
      }
      
      if (!hasPermission) {
        return {
          code: 403,
          message: '没有编辑权限'
        }
      }

      const { title, description, color, icon } = updateData
      const updates = {
        updated_at: new Date()
      }

      if (title !== undefined) {
        if (!title || title.trim().length === 0) {
          return {
            code: 400,
            message: '项目册标题不能为空'
          }
        }
        updates.title = title.trim()
      }

      if (description !== undefined) updates.description = description
      if (color !== undefined) updates.color = color
      if (icon !== undefined) updates.icon = icon

      await db.collection('todobooks')
        .doc(bookId)
        .update(updates)

      return {
        code: 0,
        message: '更新成功'
      }
    } catch (error) {
      console.error('更新项目册失败:', error)
      return {
        code: 500,
        message: '更新项目册失败'
      }
    }
  },

  /**
   * 删除项目册
   */
  async deleteTodoBook(bookId) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code !== 0) {
      return {
        code: payload.code || 30202,
        message: payload.message || payload.errMsg || '用户未登录或token已过期'
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      // 检查权限 - 内联权限检查逻辑
      let hasPermission = false
      
      // 检查是否是创建者
      const bookResult = await db.collection('todobooks')
        .where({ _id: bookId, creator_id: uid })
        .get()
      
      if (bookResult.data.length > 0) {
        hasPermission = true // 创建者有所有权限
      } else {
        // 检查成员权限
        const memberResult = await db.collection('todobook_members')
          .where({
            todobook_id: bookId,
            user_id: uid,
            is_active: true
          })
          .get()

        if (memberResult.data.length > 0) {
          const member = memberResult.data[0]
          hasPermission = member.permissions.includes('delete')
        }
      }
      
      if (!hasPermission) {
        return {
          code: 403,
          message: '没有删除权限'
        }
      }

      // 删除相关数据
      await Promise.all([
        // 删除项目册
        db.collection('todobooks').doc(bookId).remove(),
        // 删除成员关系
        db.collection('todobook_members').where({ todobook_id: bookId }).remove(),
        // 删除任务
        db.collection('todoitems').where({ todobook_id: bookId }).remove()
      ])

      return {
        code: 0,
        message: '删除成功'
      }
    } catch (error) {
      console.error('删除项目册失败:', error)
      return {
        code: 500,
        message: '删除项目册失败'
      }
    }
  },

  /**
   * 获取项目册详情
   */
  async getTodoBookDetail(bookId) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code !== 0) {
      return {
        code: payload.code || 30202,
        message: payload.message || payload.errMsg || '用户未登录或token已过期'
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      // 检查权限 - 内联权限检查逻辑
      let hasPermission = false
      
      // 检查是否是创建者
      const bookResult = await db.collection('todobooks')
        .where({ _id: bookId, creator_id: uid })
        .get()
      
      if (bookResult.data.length > 0) {
        hasPermission = true // 创建者有所有权限
      } else {
        // 检查成员权限
        const memberResult = await db.collection('todobook_members')
          .where({
            todobook_id: bookId,
            user_id: uid,
            is_active: true
          })
          .get()

        if (memberResult.data.length > 0) {
          const member = memberResult.data[0]
          hasPermission = member.permissions.includes('read')
        }
      }
      
      if (!hasPermission) {
        return {
          code: 403,
          message: '没有查看权限'
        }
      }

      const [bookDetailResult, membersResult, tasksResult] = await Promise.all([
        // 获取项目册信息
        db.collection('todobooks').doc(bookId).get(),
        
        // 获取成员列表
        db.collection('todobook_members')
          .where({ todobook_id: bookId, is_active: true })
          .get(),
        
        // 获取任务列表
        db.collection('todoitems')
          .where({ todobook_id: bookId })
          .orderBy('sort_order', 'asc')
          .orderBy('created_at', 'desc')
          .get()
      ])

      if (!bookDetailResult.data.length) {
        return {
          code: 404,
          message: '项目册不存在'
        }
      }

      // 更新最后访问时间
      await db.collection('todobook_members')
        .where({ todobook_id: bookId, user_id: uid })
        .update({ last_access_at: new Date() })

      return {
        code: 0,
        data: {
          book: bookDetailResult.data[0],
          members: membersResult.data,
          tasks: tasksResult.data
        }
      }
    } catch (error) {
      console.error('获取项目册详情失败:', error)
      return {
        code: 500,
        message: '获取项目册详情失败'
      }
    }
  },

  /**
   * 创建任务
   */
  async createTodoItem(itemData) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code !== 0) {
      return {
        code: payload.code || 30202,
        message: payload.message || payload.errMsg || '用户未登录或token已过期'
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    const { 
      todobook_id, 
      title, 
      description = '', 
      parent_id = null,
      priority = 'medium',
      due_date = null
    } = itemData

    // 数据验证
    if (!title || title.trim().length === 0) {
      return {
        code: 400,
        message: '任务标题不能为空'
      }
    }

    try {
      // 检查权限 - 内联权限检查逻辑
      let hasPermission = false
      
      // 检查是否是创建者
      const bookResult = await db.collection('todobooks')
        .where({ _id: todobook_id, creator_id: uid })
        .get()
      
      if (bookResult.data.length > 0) {
        hasPermission = true // 创建者有所有权限
      } else {
        // 检查成员权限
        const memberResult = await db.collection('todobook_members')
          .where({
            todobook_id: todobook_id,
            user_id: uid,
            is_active: true
          })
          .get()

        if (memberResult.data.length > 0) {
          const member = memberResult.data[0]
          hasPermission = member.permissions.includes('write')
        }
      }
      
      if (!hasPermission) {
        return {
          code: 403,
          message: '没有创建任务权限'
        }
      }

      const now = new Date()
      const newItem = {
        todobook_id,
        parent_id,
        title: title.trim(),
        description,
        creator_id: uid,
        assignee_id: uid,
        created_at: now,
        updated_at: now,
        due_date: due_date ? new Date(due_date) : null,
        status: 'todo',
        priority,
        tags: [],
        sort_order: 0,
        level: parent_id ? 1 : 0,
        progress: 0,
        estimated_hours: 0,
        actual_hours: 0,
        attachments: [],
        comments: [],
        subtask_count: 0,
        completed_subtask_count: 0,
        is_recurring: false,
        last_activity_at: now
      }

      const result = await db.collection('todoitems').add(newItem)

      // 更新项目册任务计数
      await db.collection('todobooks')
        .doc(todobook_id)
        .update({
          item_count: db.command.inc(1),
          last_activity_at: now
        })

      // 如果有父任务，更新父任务的子任务计数
      if (parent_id) {
        await db.collection('todoitems')
          .doc(parent_id)
          .update({
            subtask_count: db.command.inc(1),
            updated_at: now
          })
      }

      return {
        code: 0,
        data: {
          _id: result.id,
          ...newItem
        }
      }
    } catch (error) {
      console.error('创建任务失败:', error)
      return {
        code: 500,
        message: '创建任务失败'
      }
    }
  },

  /**
   * 更新任务状态
   */
  async updateTodoItemStatus(itemId, status) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code !== 0) {
      return {
        code: payload.code || 30202,
        message: payload.message || payload.errMsg || '用户未登录或token已过期'
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      // 获取任务信息
      const itemResult = await db.collection('todoitems').doc(itemId).get()
      if (!itemResult.data.length) {
        return {
          code: 404,
          message: '任务不存在'
        }
      }

      const item = itemResult.data[0]
      
      // 检查权限 - 内联权限检查逻辑
      let hasPermission = false
      
      // 检查是否是创建者
      const bookResult = await db.collection('todobooks')
        .where({ _id: item.todobook_id, creator_id: uid })
        .get()
      
      if (bookResult.data.length > 0) {
        hasPermission = true // 创建者有所有权限
      } else {
        // 检查成员权限
        const memberResult = await db.collection('todobook_members')
          .where({
            todobook_id: item.todobook_id,
            user_id: uid,
            is_active: true
          })
          .get()

        if (memberResult.data.length > 0) {
          const member = memberResult.data[0]
          hasPermission = member.permissions.includes('write')
        }
      }
      
      if (!hasPermission) {
        return {
          code: 403,
          message: '没有编辑权限'
        }
      }

      const updates = {
        status,
        updated_at: new Date(),
        last_activity_at: new Date()
      }

      // 如果任务完成，设置完成时间
      if (status === 'completed') {
        updates.completed_at = new Date()
      } else {
        updates.completed_at = null
      }

      // 更新当前任务状态
      await db.collection('todoitems').doc(itemId).update(updates)

      // 处理父子关系的状态联动
      try {
        // 如果是子任务状态变更，检查是否需要更新父任务
        if (item.parent_id) {
          // 获取父任务信息
          const parentResult = await db.collection('todoitems').doc(item.parent_id).get()
          if (parentResult.data.length > 0) {
            const parentTask = parentResult.data[0]
            
            // 获取所有子任务
            const childrenResult = await db.collection('todoitems')
              .where({ parent_id: item.parent_id })
              .get()
            
            if (childrenResult.data.length > 0) {
              const children = childrenResult.data
              const completedChildren = children.filter(child => 
                child._id === item._id ? status === 'completed' : child.status === 'completed'
              )
              
              // 更新父任务的子任务计数
              const parentUpdates = {
                completed_subtask_count: completedChildren.length,
                updated_at: new Date(),
                last_activity_at: new Date()
              }
              
              // 如果所有子任务都完成了，自动完成父任务
              if (completedChildren.length === children.length && parentTask.status !== 'completed') {
                parentUpdates.status = 'completed'
                parentUpdates.completed_at = new Date()
              }
              // 如果父任务已完成但有子任务变为未完成，父任务回退
              else if (completedChildren.length < children.length && parentTask.status === 'completed') {
                parentUpdates.status = 'todo'
                parentUpdates.completed_at = null
              }
              
              await db.collection('todoitems').doc(item.parent_id).update(parentUpdates)
            }
          }
        }
        
        // 如果是父任务状态变更，更新子任务计数
        if (item.subtask_count > 0) {
          const childrenResult = await db.collection('todoitems')
            .where({ parent_id: item._id })
            .get()
          
          if (childrenResult.data.length > 0) {
            const completedChildren = childrenResult.data.filter(child => child.status === 'completed')
            
            await db.collection('todoitems').doc(item._id).update({
              completed_subtask_count: completedChildren.length,
              updated_at: new Date(),
              last_activity_at: new Date()
            })
          }
        }
      } catch (error) {
        console.error('处理父子状态联动失败:', error)
        // 不抛出异常，避免影响主要的状态更新流程
      }

      // 更新项目册的完成计数
      if (status === 'completed' && item.status !== 'completed') {
        await db.collection('todobooks')
          .doc(item.todobook_id)
          .update({
            completed_count: db.command.inc(1),
            last_activity_at: new Date()
          })
      } else if (status !== 'completed' && item.status === 'completed') {
        await db.collection('todobooks')
          .doc(item.todobook_id)
          .update({
            completed_count: db.command.inc(-1),
            last_activity_at: new Date()
          })
      }

      return {
        code: 0,
        message: '状态更新成功'
      }
    } catch (error) {
      console.error('更新任务状态失败:', error)
      return {
        code: 500,
        message: '更新任务状态失败'
      }
    }
  },

  /**
   * 处理父子任务状态联动
   */
  async handleParentChildStatusUpdate(task, newStatus) {
    const db = uniCloud.database()
    
    try {
      // 如果是子任务状态变更，检查是否需要更新父任务
      if (task.parent_id) {
        // 获取父任务信息
        const parentResult = await db.collection('todoitems').doc(task.parent_id).get()
        if (parentResult.data.length > 0) {
          const parentTask = parentResult.data[0]
          
          // 获取所有子任务
          const childrenResult = await db.collection('todoitems')
            .where({ parent_id: task.parent_id })
            .get()
          
          if (childrenResult.data.length > 0) {
            const children = childrenResult.data
            const completedChildren = children.filter(child => 
              child._id === task._id ? newStatus === 'completed' : child.status === 'completed'
            )
            
            // 更新父任务的子任务计数
            const parentUpdates = {
              completed_subtask_count: completedChildren.length,
              updated_at: new Date(),
              last_activity_at: new Date()
            }
            
            // 如果所有子任务都完成了，自动完成父任务
            if (completedChildren.length === children.length && parentTask.status !== 'completed') {
              parentUpdates.status = 'completed'
              parentUpdates.completed_at = new Date()
            }
            // 如果父任务已完成但有子任务变为未完成，父任务回退
            else if (completedChildren.length < children.length && parentTask.status === 'completed') {
              parentUpdates.status = 'todo'
              parentUpdates.completed_at = null
            }
            
            await db.collection('todoitems').doc(task.parent_id).update(parentUpdates)
          }
        }
      }
      
      // 如果是父任务状态变更，更新子任务计数
      if (task.subtask_count > 0) {
        const childrenResult = await db.collection('todoitems')
          .where({ parent_id: task._id })
          .get()
        
        if (childrenResult.data.length > 0) {
          const completedChildren = childrenResult.data.filter(child => child.status === 'completed')
          
          await db.collection('todoitems').doc(task._id).update({
            completed_subtask_count: completedChildren.length,
            updated_at: new Date(),
            last_activity_at: new Date()
          })
        }
      }
    } catch (error) {
      console.error('处理父子状态联动失败:', error)
      // 不抛出异常，避免影响主要的状态更新流程
    }
  },

  /**
   * 获取任务详情（包含子任务）
   */
  async getTaskDetail(taskId) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code !== 0) {
      return {
        code: payload.code || 30202,
        message: payload.message || payload.errMsg || '用户未登录或token已过期'
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      // 获取任务详情
      const taskResult = await db.collection('todoitems')
        .where({ _id: taskId })
        .get()

      if (taskResult.data.length === 0) {
        return {
          code: 404,
          message: '任务不存在'
        }
      }

      const task = taskResult.data[0]

      // 检查权限：用户是否有权访问此任务所属的项目册
      // 内联权限检查逻辑
      let hasPermission = false
      
      // 检查是否是项目册创建者
      const bookResult = await db.collection('todobooks')
        .where({ _id: task.todobook_id, creator_id: uid })
        .get()
      
      if (bookResult.data.length > 0) {
        hasPermission = true
      } else {
        // 检查是否是项目册成员
        const memberResult = await db.collection('todobook_members')
          .where({
            todobook_id: task.todobook_id,
            user_id: uid,
            is_active: true
          })
          .get()

        if (memberResult.data.length > 0) {
          const member = memberResult.data[0]
          hasPermission = member.permissions.includes('read')
        }
      }
      
      if (!hasPermission) {
        return {
          code: 403,
          message: '没有访问权限'
        }
      }

      // 获取子任务
      const subtasksResult = await db.collection('todoitems')
        .where({ parent_id: taskId })
        .orderBy('sort_order', 'asc')
        .orderBy('created_at', 'asc')
        .get()

      return {
        code: 0,
        data: {
          task: task,
          subtasks: subtasksResult.data
        }
      }
    } catch (error) {
      console.error('获取任务详情失败:', error)
      return {
        code: 500,
        message: '获取任务详情失败'
      }
    }
  },

  /**
   * 检查任务权限
   */
  async checkTaskPermission(userId, todoBookId) {
    const db = uniCloud.database()
    
    try {
      // 检查是否是项目册创建者
      const bookResult = await db.collection('todobooks')
        .where({ _id: todoBookId, creator_id: userId })
        .get()
      
      if (bookResult.data.length > 0) {
        return true
      }

      // 检查是否是项目册成员
      const memberResult = await db.collection('todobook_members')
        .where({
          todobook_id: todoBookId,
          user_id: userId,
          is_active: true
        })
        .get()

      if (memberResult.data.length > 0) {
        const member = memberResult.data[0]
        return member.permissions.includes('read')
      }

      return false
    } catch (error) {
      console.error('检查任务权限失败:', error)
      return false
    }
  },

  /**
   * 检查用户权限
   */
  async checkPermission(userId, todoBookId, permission) {
    const db = uniCloud.database()
    
    try {
      // 检查是否是创建者
      const bookResult = await db.collection('todobooks')
        .where({ _id: todoBookId, creator_id: userId })
        .get()
      
      if (bookResult.data.length > 0) {
        return true // 创建者有所有权限
      }

      // 检查成员权限
      const memberResult = await db.collection('todobook_members')
        .where({
          todobook_id: todoBookId,
          user_id: userId,
          is_active: true
        })
        .get()

      if (memberResult.data.length > 0) {
        const member = memberResult.data[0]
        return member.permissions.includes(permission)
      }

      return false
    } catch (error) {
      console.error('检查权限失败:', error)
      return false
    }
  }
}