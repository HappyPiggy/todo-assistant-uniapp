// 数据同步管理云对象
const uniID = require('uni-id-common')
const crypto = require('crypto')

// 引入标签同步模块
const {
  updateTagInTasks,
  removeTagFromTasks
} = require('./module/tag/index')

module.exports = {
  _before: async function () {
    const token = this.getUniIdToken()
    if (!token) {
      throw new Error('请登录后再访问')
    }
    
    this.uniID = uniID.createInstance({
      context: this.getCloudInfo()
    })
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code && payload.code > 0) {
      throw new Error(payload.message || '登录状态无效')
    }
    
    this.uid = payload.uid
    this.db = uniCloud.database()
  },

  /**
   * 开始同步操作
   */
  async startSync(syncOptions = {}) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()
    const { 
      sync_type = 'manual', 
      device_id = '', 
      local_version = '',
      force = false 
    } = syncOptions

    try {
      // 检查是否有进行中的同步
      if (!force) {
        const ongoingSync = await db.collection('sync_records')
          .where({
            user_id: uid,
            status: 'in_progress'
          })
          .get()

        if (ongoingSync.data.length > 0) {
          return {
            code: 409,
            message: '已有同步任务进行中'
          }
        }
      }

      // 创建同步记录
      const syncRecord = {
        user_id: uid,
        device_id,
        sync_type,
        sync_direction: 'bidirectional',
        status: 'in_progress',
        created_at: new Date(),
        local_version,
        remote_version: this.generateVersion()
      }

      const syncResult = await db.collection('sync_records').add(syncRecord)
      const syncId = syncResult.id

      return {
        code: 0,
        data: {
          sync_id: syncId,
          status: 'started'
        }
      }
    } catch (error) {
      console.error('开始同步失败:', error)
      return {
        code: 500,
        message: '开始同步失败'
      }
    }
  },

  /**
   * 上传本地数据到云端
   */
  async uploadData(syncId, localData) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      // 验证同步记录
      const syncRecord = await db.collection('sync_records').doc(syncId).get()
      if (!syncRecord.data.length || syncRecord.data[0].user_id !== uid) {
        return {
          code: 404,
          message: '同步记录不存在'
        }
      }

      const { todobooks = [], todoitems = [] } = localData
      let syncSummary = {
        todobooks_synced: 0,
        todoitems_synced: 0,
        conflicts_resolved: 0
      }

      // 处理项目册数据
      for (const todobook of todobooks) {
        await this.syncTodoBook(uid, todobook, syncSummary)
      }

      // 处理任务数据
      for (const todoitem of todoitems) {
        await this.syncTodoItem(uid, todoitem, syncSummary)
      }

      // 更新同步进度
      await db.collection('sync_records').doc(syncId).update({
        data_summary: syncSummary,
        updated_at: new Date()
      })

      return {
        code: 0,
        data: {
          sync_summary: syncSummary
        }
      }
    } catch (error) {
      console.error('上传数据失败:', error)
      
      // 标记同步失败
      await db.collection('sync_records').doc(syncId).update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date()
      })

      return {
        code: 500,
        message: '上传数据失败'
      }
    }
  },

  /**
   * 下载云端数据
   */
  async downloadData(syncId, lastSyncTime) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      // 验证同步记录
      const syncRecord = await db.collection('sync_records').doc(syncId).get()
      if (!syncRecord.data.length || syncRecord.data[0].user_id !== uid) {
        return {
          code: 404,
          message: '同步记录不存在'
        }
      }

      const syncFilter = lastSyncTime ? {
        updated_at: db.command.gt(new Date(lastSyncTime))
      } : {}

      // 先获取用户参与的项目册ID列表
      const memberResult = await db.collection('todobook_members')
        .where({ user_id: uid, is_active: true })
        .field({ todobook_id: true })
        .get()
      
      const memberBookIds = memberResult.data.map(item => item.todobook_id)
      
      // 构建查询条件
      const whereCondition = {
        ...syncFilter,
        $or: [
          { creator_id: uid }
        ]
      }
      
      // 如果用户参与了其他项目册，添加到查询条件中
      if (memberBookIds.length > 0) {
        whereCondition.$or.push({ _id: db.command.in(memberBookIds) })
      }

      // 获取用户的项目册
      const todoBooksResult = await db.collection('todobooks')
        .where(whereCondition)
        .get()

      // 获取用户相关的任务
      const todoItemsResult = await db.collection('todoitems')
        .where({
          ...syncFilter,
          todobook_id: db.command.in(
            todoBooksResult.data.map(book => book._id)
          )
        })
        .get()

      // 获取成员关系
      const membersResult = await db.collection('todobook_members')
        .where({
          user_id: uid,
          is_active: true
        })
        .get()

      return {
        code: 0,
        data: {
          todobooks: todoBooksResult.data,
          todoitems: todoItemsResult.data,
          members: membersResult.data,
          sync_time: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('下载数据失败:', error)
      return {
        code: 500,
        message: '下载数据失败'
      }
    }
  },

  /**
   * 完成同步操作
   */
  async completeSync(syncId) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      const syncRecord = await db.collection('sync_records').doc(syncId).get()
      if (!syncRecord.data.length || syncRecord.data[0].user_id !== uid) {
        return {
          code: 404,
          message: '同步记录不存在'
        }
      }

      const startTime = syncRecord.data[0].created_at
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      await db.collection('sync_records').doc(syncId).update({
        status: 'completed',
        completed_at: endTime,
        sync_duration: duration
      })

      return {
        code: 0,
        data: {
          status: 'completed',
          duration: duration
        }
      }
    } catch (error) {
      console.error('完成同步失败:', error)
      return {
        code: 500,
        message: '完成同步失败'
      }
    }
  },

  /**
   * 获取同步历史
   */
  async getSyncHistory(limit = 10) {
    const token = this.getUniIdToken()
    if (!token) {
      return {
        code: 30202,
        message: '用户未登录或token已过期'
      }
    }
    
    const payload = await this.uniID.checkToken(token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid
    const db = uniCloud.database()

    try {
      const result = await db.collection('sync_records')
        .where({
          user_id: uid
        })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get()

      return {
        code: 0,
        data: result.data
      }
    } catch (error) {
      console.error('获取同步历史失败:', error)
      return {
        code: 500,
        message: '获取同步历史失败'
      }
    }
  },

  /**
   * 同步单个项目册
   */
  async syncTodoBook(uid, localTodoBook, syncSummary) {
    const db = uniCloud.database()
    
    try {
      // 检查云端是否存在
      const existing = await db.collection('todobooks')
        .where({
          _id: localTodoBook._id
        })
        .get()

      if (existing.data.length > 0) {
        // 检查冲突
        const cloudData = existing.data[0]
        const localUpdateTime = new Date(localTodoBook.updated_at)
        const cloudUpdateTime = new Date(cloudData.updated_at)

        if (localUpdateTime > cloudUpdateTime) {
          // 本地更新，更新云端
          await db.collection('todobooks')
            .doc(localTodoBook._id)
            .update({
              ...localTodoBook,
              updated_at: new Date()
            })
          syncSummary.todobooks_synced++
        } else if (cloudUpdateTime > localUpdateTime) {
          // 云端更新，标记冲突
          syncSummary.conflicts_resolved++
        }
      } else {
        // 新增到云端
        await db.collection('todobooks').add({
          ...localTodoBook,
          creator_id: uid,
          created_at: new Date(),
          updated_at: new Date()
        })
        syncSummary.todobooks_synced++
      }
    } catch (error) {
      console.error('同步项目册失败:', error)
      throw error
    }
  },

  /**
   * 同步单个任务
   */
  async syncTodoItem(uid, localTodoItem, syncSummary) {
    const db = uniCloud.database()
    
    try {
      const existing = await db.collection('todoitems')
        .where({
          _id: localTodoItem._id
        })
        .get()

      if (existing.data.length > 0) {
        const cloudData = existing.data[0]
        const localUpdateTime = new Date(localTodoItem.updated_at)
        const cloudUpdateTime = new Date(cloudData.updated_at)

        if (localUpdateTime > cloudUpdateTime) {
          await db.collection('todoitems')
            .doc(localTodoItem._id)
            .update({
              ...localTodoItem,
              updated_at: new Date()
            })
          syncSummary.todoitems_synced++
        } else if (cloudUpdateTime > localUpdateTime) {
          syncSummary.conflicts_resolved++
        }
      } else {
        await db.collection('todoitems').add({
          ...localTodoItem,
          creator_id: uid,
          created_at: new Date(),
          updated_at: new Date()
        })
        syncSummary.todoitems_synced++
      }
    } catch (error) {
      console.error('同步任务失败:', error)
      throw error
    }
  },

  /**
   * 生成版本号
   */
  generateVersion() {
    return crypto.createHash('md5')
      .update(Date.now().toString())
      .digest('hex')
      .substring(0, 8)
  },

  // 标签同步接口
  updateTagInTasks,
  removeTagFromTasks
}