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
    const payload = await this.uniID.checkToken(this.getCloudInfo().token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()
    const { include_archived = false, limit = 20, skip = 0 } = options

    try {
      // 构建查询条件
      const whereCondition = {
        $or: [
          { creator_id: uid },
          { 
            _id: db.command.in(
              db.collection('todobook_members')
                .where({ user_id: uid, is_active: true })
                .field({ todobook_id: true })
            )
          }
        ]
      }

      if (!include_archived) {
        whereCondition.is_archived = false
      }

      const result = await db.collection('todobooks')
        .where(whereCondition)
        .orderBy('sort_order', 'asc')
        .orderBy('updated_at', 'desc')
        .skip(skip)
        .limit(limit)
        .get()

      // 获取每个项目册的成员信息和任务统计
      const todoBooks = await Promise.all(
        result.data.map(async (book) => {
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
            task_stats: taskStats
          }
        })
      )

      return {
        code: 0,
        data: todoBooks
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
    const payload = await this.uniID.checkToken(this.getCloudInfo().token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
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
    const payload = await this.uniID.checkToken(this.getCloudInfo().token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      // 检查权限
      const hasPermission = await this.checkPermission(uid, bookId, 'write')
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
    const payload = await this.uniID.checkToken(this.getCloudInfo().token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      // 检查权限
      const hasPermission = await this.checkPermission(uid, bookId, 'delete')
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
    const payload = await this.uniID.checkToken(this.getCloudInfo().token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      // 检查权限
      const hasPermission = await this.checkPermission(uid, bookId, 'read')
      if (!hasPermission) {
        return {
          code: 403,
          message: '没有查看权限'
        }
      }

      const [bookResult, membersResult, tasksResult] = await Promise.all([
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

      if (!bookResult.data.length) {
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
          book: bookResult.data[0],
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
    const payload = await this.uniID.checkToken(this.getCloudInfo().token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
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
      // 检查权限
      const hasPermission = await this.checkPermission(uid, todobook_id, 'write')
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
    const payload = await this.uniID.checkToken(this.getCloudInfo().token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
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
      const hasPermission = await this.checkPermission(uid, item.todobook_id, 'write')
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

      // 如果任务完成，设置完成时间和进度
      if (status === 'completed') {
        updates.completed_at = new Date()
        updates.progress = 100
      } else {
        updates.completed_at = null
        if (status === 'todo') {
          updates.progress = 0
        } else if (status === 'in_progress') {
          updates.progress = Math.max(updates.progress || 0, 10)
        }
      }

      await db.collection('todoitems').doc(itemId).update(updates)

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