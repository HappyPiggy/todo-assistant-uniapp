// 项目册管理云对象
const uniID = require('uni-id-common')

// 引入各功能模块
const {
  getTodoBooks,
  createTodoBook,
  getTodoBookDetail,
  updateTodoBook,
  deleteTodoBook
} = require('./module/todobook/index')

const {
  createTodoItem,
  getTaskDetail,
  updateTodoItemStatus
} = require('./module/task/index')

const {
  getMembers,
  inviteUserByNickname,
  removeMember,
  leaveBook
} = require('./module/member/index')

const {
  getTaskComments,
  addTaskComment,
  updateTaskComment,
  deleteTaskComment
} = require('./module/comments/index')

module.exports = {
  _before: function () {
    this.uniID = uniID.createInstance({
      context: this.getCloudInfo()
    })
    // 为子模块提供上下文
    this.db = uniCloud.database()
    this.uid = null
    this.userInfo = null
  },

  async _beforeEach() {
    // 在每个方法执行前获取用户信息
    const token = this.getUniIdToken()
    if (token) {
      const payload = await this.uniID.checkToken(token)
      if (payload.code === 0) {
        this.uid = payload.uid
        this.userInfo = payload
      }
    }
  },

  // 项目册管理接口
  getTodoBooks,
  createTodoBook,
  getTodoBookDetail,
  updateTodoBook,
  deleteTodoBook,

  // 任务管理接口
  createTodoItem,
  getTaskDetail,
  updateTodoItemStatus,

  // 成员管理接口
  getMembers,
  inviteUserByNickname,
  removeMember,
  leaveBook,

  // 评论管理接口
  /**
   * 获取任务评论列表（分页）
   */
  async getTaskComments(taskId, page = 1, pageSize = 20) {
    return await getTaskComments.call(this, { taskId, page, pageSize })
  },

  /**
   * 添加任务评论
   */
  async addTaskComment(taskId, content, parentCommentId = null) {
    return await addTaskComment.call(this, { taskId, content, parentCommentId })
  },

  /**
   * 编辑评论
   */
  async updateTaskComment(commentId, content) {
    return await updateTaskComment.call(this, { commentId, content })
  },

  /**
   * 删除评论
   */
  async deleteTaskComment(commentId) {
    return await deleteTaskComment.call(this, { commentId })
  }
}