// 用户管理云对象
const uniID = require('uni-id-common')

module.exports = {
  _before: async function () {
    const token = this.getUniIdToken();  
    if (!token) {  
      throw new Error('请登录后再访问');  
    } 

    this.uniID = uniID.createInstance({
      context: this.getCloudInfo()
    })
    const {uid} = await this.uniID.checkToken(token)
    this.uid = uid
    this.db = uniCloud.database()
  },

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    const { uid, db } = this
    const userInfo = await this.uniID.getUserInfo({
      uid,
      field: ['_id', 'username', 'nickname', 'avatar_file', 'avatar', 'gender', 'mobile', 'email', 'comment', 'register_date', 'last_login_date']
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
    const { uid, db } = this
    // 数据验证
    const { nickname, gender, email, comment, avatar_file, avatar } = profileData
    
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

    // 检查昵称唯一性
    if (nickname && nickname.trim()) {
      const db = uniCloud.database()
      const nicknameCheck = await db.collection('uni-id-users')
        .where({
          nickname: nickname.trim(),
          _id: db.command.neq(uid)
        })
        .count()
      
      if (nicknameCheck.total > 0) {
        return {
          code: 400,
          message: '昵称已被使用，请选择其他昵称'
        }
      }
    }

    // 准备更新数据
    const updateData = {}
    if (nickname !== undefined) updateData.nickname = nickname.trim()
    if (gender !== undefined) updateData.gender = gender
    if (email !== undefined) updateData.email = email
    if (comment !== undefined) updateData.comment = comment
    if (avatar_file !== undefined) updateData.avatar_file = avatar_file
    if (avatar !== undefined) updateData.avatar = avatar

    try {
      // 添加调试日志
      console.log('准备更新用户资料:', {
        uid,
        updateData: JSON.stringify(updateData, null, 2)
      })

      // 先检查用户是否存在
      const userExists = await this.db.collection('uni-id-users')
        .doc(uid)
        .get()

      const currentUserData = userExists.data[0] || {}
      console.log('用户是否存在:', {
        exists: userExists.data.length > 0,
        userData: currentUserData
      })

      // 检查数据是否真正需要更新
      const hasChanges = Object.keys(updateData).some(key => {
        const newValue = updateData[key]
        const currentValue = currentUserData[key]
        console.log(`字段 ${key}: 当前值=${currentValue}, 新值=${newValue}, 是否不同=${newValue !== currentValue}`)
        return newValue !== currentValue
      })

      console.log('是否有数据变化:', hasChanges)

      if (userExists.data.length === 0) {
        return {
          code: 404,
          message: '用户不存在'
        }
      }

      // 直接更新数据库中的用户信息
      const result = await this.db.collection('uni-id-users')
        .doc(uid)
        .update(updateData)

      console.log('更新结果:', JSON.stringify(result, null, 2))

      // 如果没有数据变化，也认为是成功的
      if (result.updated === 1 || !hasChanges) {
        return {
          code: 0,
          message: result.updated === 1 ? '更新成功' : '数据没有变化',
          data: updateData
        }
      }

      return {
        code: 500,
        message: '更新失败，请稍后重试',
        debug: { result, uid, updateData, hasChanges }
      }
    } catch (error) {
      console.error('更新用户资料失败:', error)
      return {
        code: 500,
        message: '更新失败，请稍后重试',
        error: error.message
      }
    }
  },

  /**
   * 获取用户统计信息
   */
  async getUserStats() {
    const { uid, db } = this

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
    const { uid, db } = this

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
    const { uid, db } = this

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