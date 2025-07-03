// 用户管理云对象
const uniID = require('uni-id-common')

module.exports = {
  _before: function () {
    // 统一的前置校验
    this.uniID = uniID.createInstance({
      context: this.getCloudInfo()
    })
  },

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    const payload = await this.uniID.checkToken(this.getCloudInfo().token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid
    const userInfo = await this.uniID.getUserInfo({
      uid,
      field: ['_id', 'username', 'nickname', 'avatar_file', 'gender', 'mobile', 'email', 'comment', 'register_date', 'last_login_date']
    })

    if (userInfo.code === 0) {
      return {
        code: 0,
        data: userInfo.userInfo
      }
    }

    return {
      code: userInfo.code,
      message: userInfo.message
    }
  },

  /**
   * 更新用户资料
   */
  async updateProfile(profileData) {
    const payload = await this.uniID.checkToken(this.getCloudInfo().token)
    if (payload.code && payload.code > 0) {
      return {
        code: payload.code,
        message: payload.message
      }
    }

    const uid = payload.uid

    // 数据验证
    const { nickname, gender, email, comment, avatar_file } = profileData
    
    if (nickname && (nickname.length < 2 || nickname.length > 20)) {
      return {
        code: 400,
        message: '昵称长度应为2-20个字符'
      }
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        code: 400,
        message: '邮箱格式不正确'
      }
    }

    if (comment && comment.length > 200) {
      return {
        code: 400,
        message: '个人简介不能超过200个字符'
      }
    }

    // 准备更新数据
    const updateData = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (gender !== undefined) updateData.gender = gender
    if (email !== undefined) updateData.email = email
    if (comment !== undefined) updateData.comment = comment
    if (avatar_file !== undefined) updateData.avatar_file = avatar_file

    try {
      const result = await this.uniID.updateUser({
        uid,
        ...updateData
      })

      if (result.code === 0) {
        return {
          code: 0,
          message: '更新成功',
          data: updateData
        }
      }

      return {
        code: result.code,
        message: result.message
      }
    } catch (error) {
      console.error('更新用户资料失败:', error)
      return {
        code: 500,
        message: '更新失败，请稍后重试'
      }
    }
  },

  /**
   * 获取用户统计信息
   */
  async getUserStats() {
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
      // 获取用户的项目册数量
      const todoBooksResult = await db.collection('todobooks')
        .where({
          creator_id: uid,
          is_archived: false
        })
        .count()

      // 获取用户的任务统计
      const todoItemsResult = await db.collection('todoitems')
        .aggregate()
        .match({
          creator_id: uid
        })
        .group({
          _id: '$status',
          count: db.command.aggregate.sum(1)
        })
        .end()

      // 获取最近同步记录
      const lastSyncResult = await db.collection('sync_records')
        .where({
          user_id: uid,
          status: 'completed'
        })
        .orderBy('completed_at', 'desc')
        .limit(1)
        .get()

      // 处理统计数据
      const taskStats = {
        total: 0,
        todo: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      }

      if (todoItemsResult.data) {
        todoItemsResult.data.forEach(item => {
          taskStats[item._id] = item.count
          taskStats.total += item.count
        })
      }

      const stats = {
        todobook_count: todoBooksResult.total || 0,
        task_stats: taskStats,
        last_sync_time: lastSyncResult.data.length > 0 ? 
          lastSyncResult.data[0].completed_at : null
      }

      return {
        code: 0,
        data: stats
      }
    } catch (error) {
      console.error('获取用户统计失败:', error)
      return {
        code: 500,
        message: '获取统计信息失败'
      }
    }
  },

  /**
   * 更新用户设置
   */
  async updateSettings(settings) {
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
      // 检查是否已有设置记录
      const existingSettings = await db.collection('user_settings')
        .where({
          user_id: uid
        })
        .get()

      const settingsData = {
        user_id: uid,
        ...settings,
        updated_at: new Date()
      }

      let result
      if (existingSettings.data.length > 0) {
        // 更新现有设置
        result = await db.collection('user_settings')
          .doc(existingSettings.data[0]._id)
          .update(settingsData)
      } else {
        // 创建新设置
        settingsData.created_at = new Date()
        result = await db.collection('user_settings')
          .add(settingsData)
      }

      return {
        code: 0,
        message: '设置更新成功'
      }
    } catch (error) {
      console.error('更新用户设置失败:', error)
      return {
        code: 500,
        message: '设置更新失败'
      }
    }
  },

  /**
   * 获取用户设置
   */
  async getSettings() {
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
      const result = await db.collection('user_settings')
        .where({
          user_id: uid
        })
        .get()

      const defaultSettings = {
        sync_on_startup: true,
        sync_on_background: false,
        notification_enabled: true,
        sound_enabled: true,
        vibration_enabled: true,
        theme: 'light',
        language: 'zh-CN'
      }

      const settings = result.data.length > 0 ? 
        { ...defaultSettings, ...result.data[0] } : 
        defaultSettings

      return {
        code: 0,
        data: settings
      }
    } catch (error) {
      console.error('获取用户设置失败:', error)
      return {
        code: 500,
        message: '获取设置失败'
      }
    }
  }
}